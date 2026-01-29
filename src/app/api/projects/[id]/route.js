import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import dbConnect from "@/lib/db";
import Project from "@/models/Project";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function PUT(req, { params }) {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session || !session.userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        await dbConnect();
        const data = await req.json();

        console.log(`[PUT Project] Attempting update. ProjectID: ${id}, UserID: ${session.userId}`);


        const updatedProject = await Project.findOneAndUpdate(
            { _id: id, userId: session.userId },
            {
                $set: {
                    settings: data.settings,
                    watchSettings: data.watchSettings,
                    templates: data.templates,
                    rules: data.rules,
                    batchConfig: data.batchConfig,
                    files: data.files,
                    updatedAt: new Date()
                }
            },
            { new: true }
        );

        if (!updatedProject) {
            console.error(`[PUT Project] Not found or auth mismatch. ID: ${id}`);
            return NextResponse.json({ error: "Project not found or access denied" }, { status: 404 });
        }

        return NextResponse.json({
            project: {
                ...updatedProject.toObject(),
                id: updatedProject._id.toString()
            }
        });
    } catch (e) {
        console.error("[PUT Project] Error:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function DELETE(req, { params }) {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session || !session.userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        await dbConnect();
        const result = await Project.deleteOne({ _id: id, userId: session.userId });

        if (result.deletedCount === 0) {
            return NextResponse.json({ error: "Project not found or access denied" }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
