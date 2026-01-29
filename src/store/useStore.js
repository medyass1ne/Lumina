import { create } from 'zustand';

const api = {
    fetchProjects: async () => {
        const res = await fetch('/api/projects');
        const data = await res.json();
        return data.projects || [];
    },
    createProject: async (name) => {
        const res = await fetch('/api/projects', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name })
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        return data.project;
    },
    updateProject: async (id, projectData) => {
        const res = await fetch(`/api/projects/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(projectData)
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        return data.project;
    },
    deleteProject: async (id) => {
        const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        return data.success;
    },
    fetchSettings: async () => {
        const res = await fetch('/api/user/settings');
        const data = await res.json();
        return data.settings;
    },
    updateSettings: async (settings) => {
        const res = await fetch('/api/user/settings', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(settings)
        });
        const data = await res.json();
        return data.settings;
    }
};

export const useStore = create((set, get) => ({
    user: null,
    isAuthenticated: false,
    isGlobalProcessing: false,
    isLoading: true,

    projects: [],
    activeProjectId: null,

    userSettings: {
        notifications: true,
        defaultQuality: "2",
        autoApplyRules: true,
        batchProcessing: true,
        cacheTemplates: true
    },

    login: (user) => {
        set({ user, isAuthenticated: true });
        get().fetchAndSetProjects();
        get().fetchAndSetUserSettings();
    },

    fetchAndSetUserSettings: async () => {
        try {
            const settings = await api.fetchSettings();
            if (settings) set({ userSettings: settings });
        } catch (error) {
            console.error("Failed to fetch user settings:", error);
        }
    },

    updateUserSettings: async (newSettings) => {
        set((state) => ({ userSettings: { ...state.userSettings, ...newSettings } }));

        try {
            await api.updateSettings({ ...get().userSettings, ...newSettings });
        } catch (error) {
            console.error("Failed to save user settings:", error);
        }
    },
    logout: () => set({ user: null, isAuthenticated: false, projects: [], activeProjectId: null }),
    setGlobalProcessing: (isGlobalProcessing) => set({ isGlobalProcessing }),

    fetchAndSetProjects: async () => {
        set({ isLoading: true });
        try {
            const projects = await api.fetchProjects();
            set({ projects, isLoading: false, activeProjectId: projects.length > 0 ? projects[0].id : null });
        } catch (error) {
            console.error("Failed to fetch projects:", error);
            set({ isLoading: false });
        }
    },

    createProject: async (name) => {
        try {
            const newProject = await api.createProject(name);
            set((state) => ({
                projects: [newProject, ...state.projects],
                activeProjectId: newProject.id
            }));
            return newProject;
        } catch (error) {
            console.error("Create project failed:", error);
            throw error;
        }
    },

    setActiveProject: (id) => set({ activeProjectId: id }),

    deleteProject: async (id) => {
        try {
            await api.deleteProject(id);
            set((state) => {
                const newProjects = state.projects.filter(p => p.id !== id);
                return {
                    projects: newProjects,
                    activeProjectId: state.activeProjectId === id
                        ? (newProjects.length > 0 ? newProjects[0].id : null)
                        : state.activeProjectId
                };
            });
        } catch (error) {
            console.error("Delete failed:", error);
            alert("Failed to delete project");
        }
    },

    // Generic Update Helper (Optimistic UI + API Sync)
    _syncProject: async (projectId, transformFn) => {
        const state = get();
        const project = state.projects.find(p => p.id === projectId);
        if (!project) return;

        const updatedProject = transformFn(project);

        set((state) => ({
            projects: state.projects.map(p => p.id === projectId ? updatedProject : p)
        }));

        // 2. API Call (Debounce could be added here if needed, but for now exact sync)
        try {

        } catch (error) {
            console.error("Sync failed:", error);
            // Revert? (Complex without previous state snapshot, skip for now)
        }
    },


    updateProjectSettings: async (projectId, settings) => {
        set(state => ({
            projects: state.projects.map(p => p.id === projectId ? { ...p, settings: { ...p.settings, ...settings } } : p)
        }));
        await api.updateProject(projectId, { settings });
    },

    updateWatchSettings: async (projectId, settings) => {
        set((state) => ({
            projects: state.projects.map(p =>
                p.id === projectId
                    ? { ...p, watchSettings: { ...p.watchSettings, ...settings } }
                    : p
            )
        }));

        try {
            // Check if we have a real MondoDB ID (not a timestamp)
            const project = get().projects.find(p => p.id === projectId);
            if (project && project.id.length > 20) {
                await api.updateProject(projectId, { watchSettings: project.watchSettings });
            }
        } catch (error) {
            console.error("Failed to sync watch settings:", error);
        }
    },

    addTemplate: async (template) => {
        const state = get();
        if (!state.activeProjectId) return;
        const project = state.projects.find(p => p.id === state.activeProjectId);
        if (!project) return;

        const newTemplate = { ...template, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
        const newTemplates = [...project.templates, newTemplate];

        set(s => ({
            projects: s.projects.map(p => p.id === project.id ? { ...p, templates: newTemplates } : p)
        }));

        await api.updateProject(project.id, { templates: newTemplates });
    },

    updateTemplate: async (templateId, updates) => {
        const state = get();
        if (!state.activeProjectId) return;
        const project = state.projects.find(p => p.id === state.activeProjectId);
        if (!project) return;

        const newTemplates = project.templates.map(t =>
            t.id === templateId ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t
        );

        set(s => ({
            projects: s.projects.map(p => p.id === project.id ? { ...p, templates: newTemplates } : p)
        }));

        await api.updateProject(project.id, { templates: newTemplates });
    },

    deleteTemplate: async (templateId) => {
        const state = get();
        if (!state.activeProjectId) return;
        const project = state.projects.find(p => p.id === state.activeProjectId);
        if (!project) return;

        const newTemplates = project.templates.filter(t => t.id !== templateId);

        set(s => ({
            projects: s.projects.map(p => p.id === project.id ? { ...p, templates: newTemplates } : p)
        }));

        await api.updateProject(project.id, { templates: newTemplates });
    },

    addRule: async (rule) => {
        const state = get();
        if (!state.activeProjectId) return;
        const project = state.projects.find(p => p.id === state.activeProjectId);
        const newRule = { ...rule, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
        const newRules = [...(project.rules || []), newRule];

        set(s => ({
            projects: s.projects.map(p => p.id === project.id ? { ...p, rules: newRules } : p)
        }));
        await api.updateProject(project.id, { rules: newRules });
    },

    updateRule: async (ruleId, updates) => {
        const state = get();
        if (!state.activeProjectId) return;
        const project = state.projects.find(p => p.id === state.activeProjectId);
        const newRules = project.rules.map(r => r.id === ruleId ? { ...r, ...updates } : r);

        set(s => ({
            projects: s.projects.map(p => p.id === project.id ? { ...p, rules: newRules } : p)
        }));
        await api.updateProject(project.id, { rules: newRules });
    },

    deleteRule: async (ruleId) => {
        const state = get();
        if (!state.activeProjectId) return;
        const project = state.projects.find(p => p.id === state.activeProjectId);
        const newRules = project.rules.filter(r => r.id !== ruleId);

        set(s => ({
            projects: s.projects.map(p => p.id === project.id ? { ...p, rules: newRules } : p)
        }));
        await api.updateProject(project.id, { rules: newRules });
    },

    addFiles: async (newFiles) => {
        const state = get();
        if (!state.activeProjectId) return;
        const project = state.projects.find(p => p.id === state.activeProjectId);

        const existingIds = new Set(project.files.map(f => f.id));
        const uniqueNewFiles = newFiles.filter(f => !existingIds.has(f.id));
        if (uniqueNewFiles.length === 0) return;

        const updatedFiles = [...project.files, ...uniqueNewFiles];

        set(s => ({
            projects: s.projects.map(p => p.id === project.id ? { ...p, files: updatedFiles } : p)
        }));

        await api.updateProject(project.id, { files: updatedFiles });
    },

    removeFile: async (fileId) => {
        const state = get();
        if (!state.activeProjectId) return;
        const project = state.projects.find(p => p.id === state.activeProjectId);

        const updatedFiles = project.files.filter(f => f.id !== fileId);

        set(s => ({
            projects: s.projects.map(p => p.id === project.id ? { ...p, files: updatedFiles } : p)
        }));
        await api.updateProject(project.id, { files: updatedFiles });
    },

    updateFileStatus: async (fileId, status, progress) => {
        // Optimistic, no sync for progress (too frequent)

        set(s => {
            const project = s.projects.find(p => p.id === s.activeProjectId);
            if (!project) return s;
            return {
                projects: s.projects.map(p =>
                    p.id === s.activeProjectId
                        ? { ...p, files: p.files.map(f => f.id === fileId ? { ...f, status, progress: progress ?? f.progress } : f) }
                        : p
                )
            };
        });

        // Only sync if status changed (not just progress)
        if (status === 'done' || status === 'error' || status === 'processed') {
            const state = get();
            const project = state.projects.find(p => p.id === state.activeProjectId);
            await api.updateProject(state.activeProjectId, { files: project.files });
        }
    },

    updateFileMetadata: async (fileId, updates) => {
        const state = get();
        if (!state.activeProjectId) return;
        const project = state.projects.find(p => p.id === state.activeProjectId);

        const updatedFiles = project.files.map(f => f.id === fileId ? { ...f, ...updates } : f);

        set(s => ({
            projects: s.projects.map(p => p.id === project.id ? { ...p, files: updatedFiles } : p)
        }));

        const filesToSync = updatedFiles.map(f => {
            const { blob, ...rest } = f;
            return rest;
        });

        await api.updateProject(project.id, { files: filesToSync });
    },

    getActiveProject: () => {
        const state = get();
        return state.projects.find(p => p.id === state.activeProjectId);
    },
    getTemplates: () => {
        const state = get();
        const p = state.projects.find(p => p.id === state.activeProjectId);
        return p ? p.templates : [];
    },
    getRules: () => {
        const state = get();
        const p = state.projects.find(p => p.id === state.activeProjectId);
        return p ? p.rules : [];
    },
    getFiles: () => {
        const state = get();
        const p = state.projects.find(p => p.id === state.activeProjectId);
        return p ? p.files : [];
    },
}));
