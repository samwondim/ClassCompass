import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { validate, parse } from '@telegram-apps/init-data-node';
import { PrismaClient } from '@prisma/client';
import { requestContact } from '@telegram-apps/sdk-react';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  requestContact().then(contact => { return { "status": "success", "contact": contact } })
}
