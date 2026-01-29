import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function GET(req) {
    const session = await getServerSession(authOptions);
    if (!session || !session.userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        await dbConnect();
        const user = await User.findById(session.userId);
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const settings = user.settings || {
            notifications: true,
            defaultQuality: "2",
            autoApplyRules: true,
            batchProcessing: true,
            cacheTemplates: true
        };

        return NextResponse.json({ settings });
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function PUT(req) {
    const session = await getServerSession(authOptions);
    if (!session || !session.userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        await dbConnect();
        const data = await req.json();

        const user = await User.findByIdAndUpdate(
            session.userId,
            { $set: { settings: data } },
            { new: true, upsert: true }
        );

        return NextResponse.json({ settings: user.settings });
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
