import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import dbConnect from "@/lib/db";
import Project from "@/models/Project";
import { authOptions } from "../auth/[...nextauth]/route";

export async function GET(req) {
    const session = await getServerSession(authOptions);
    if (!session || !session.userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        await dbConnect();
        const projects = await Project.find({ userId: session.userId }).sort({ updatedAt: -1 });

        const mappedProjects = projects.map(p => ({
            ...p.toObject(),
            id: p._id.toString()
        }));

        return NextResponse.json({ projects: mappedProjects });
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function POST(req) {
    const session = await getServerSession(authOptions);
    if (!session || !session.userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        await dbConnect();
        const data = await req.json();

        const newProject = await Project.create({
            userId: session.userId,
            name: data.name || "Untitled Project",
            settings: {
                watermarkText: 'Confidential',
                scale: 2,
                outputFormat: 'png',
                ...data.settings
            },
            watchSettings: {
                isEnabled: false,
                scale: 2
            },
            files: [],
            templates: [],
            rules: [],
            batchConfig: {},
            createdAt: new Date(),
            updatedAt: new Date()
        });

        return NextResponse.json({
            project: {
                ...newProject.toObject(),
                id: newProject._id.toString()
            }
        });
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
