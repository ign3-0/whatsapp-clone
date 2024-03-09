import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { WebhookEvent } from '@clerk/nextjs/server'

import { db } from '@/lib/db'

export async function POST(req: Request){
    const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET

    if (!WEBHOOK_SECRET) {
        throw new Error(
            'Please add Clerk_Webhook_Secret from Clerk Dashboard to .env file'
        )
    }

    // Get Headers
    const headerPayload = headers()
    const svix_id = headerPayload.get("svix-id")
    const svix_timestamp = headerPayload.get("svix-timestamp")
    const svix_signature = headerPayload.get("svix-signature");

    // If there are no headers, Throw an Error
    if (!svix_id || !svix_signature || !svix_timestamp){
        return new Response('Error Occured -- No Svix Headers', {
            status: 400
        })
    }

    // Get the Body
    const payload = await req.json()
    const body = JSON.stringify(payload)

    // Create a new Svix Instance with your Secret
    const wh = new Webhook(WEBHOOK_SECRET)

    let evt: WebhookEvent

    // Verify the Payload with the Headers
    try {
        evt = wh.verify(body, {
            "svix-id": svix_id,
            "svix-timestamp": svix_timestamp,
            "svix-signature": svix_signature
        }) as WebhookEvent
    } catch (error) {
        console.log('Error Verifying Webhook: ', error)
        return new Response('Error Occured', {
            status: 400
        })
    }

    const eventType = evt.type

    if (eventType === 'user.created'){
        await db.user.create({
            data: {
                externalUserId: payload.data.id,
                username: payload.data.username,
                phoneNumber: payload.data.phone_numbers[0].phone_number
            }
        })
    }

    if (eventType === 'user.updated'){
        await db.user.update({
            where: {
                externalUserId: payload.data.id,
            },
            data: {
                username: payload.data.username,
                phoneNumber: payload.data.phone_numbers[0].phone_number
            }
        })
    }

    if (eventType === 'user.deleted'){
        await db.user.delete({
            where: {
                externalUserId: payload.data.id
            }
        })
    }

    return new Response('', { status: 200 })
}