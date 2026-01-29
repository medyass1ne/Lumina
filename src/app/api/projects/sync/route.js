import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import dbConnect from "@/lib/db";
import Project from "@/models/Project";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function POST(req) {
    const session = await getServerSession(authOptions);

    if (!session || !session.userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        await dbConnect();
        const data = await req.json();




        const filter = {
            userId: session.userId,
            name: data.name
        };

        const update = {
            settings: data.settings,
            watchSettings: data.watchSettings,
            templates: data.templates,
            rules: data.rules,
            batchConfig: data.batchConfig
        };

        const project = await Project.findOneAndUpdate(filter, update, {
            new: true,
            upsert: true,
            setDefaultsOnInsert: true
        });

        return NextResponse.json({ success: true, projectId: project._id });

    } catch (e) {
        console.error("Sync error:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
