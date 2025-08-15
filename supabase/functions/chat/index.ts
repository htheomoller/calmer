import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { message, userId } = await req.json()
    
    if (!message || !userId) {
      return new Response(
        JSON.stringify({ error: 'Message and userId are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get recent chat history (last 10 messages)
    const { data: chatHistory } = await supabaseClient
      .from('chat_messages')
      .select('role, content')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10)

    // Reverse to get chronological order
    const messages = chatHistory?.reverse() || []

    // Add system message for Calmer's personality
    const systemMessage = {
      role: 'system',
      content: `You are Calmer, a friendly, mindful chat companion that helps small business owners grow online without burning out.
Your goal is to make social media feel sustainable, supportive of real life, and stress-free.
Speak in a calm, encouraging, relatable tone. Mirror the user's tone but never pressure them. Avoid jargon, hype, and robotic phrases. Keep answers under 150 words unless asked for more.
Focus on giving practical, low-stress guidance about: muting notifications, limiting app use, avoiding doomscrolling, and planning light, consistent posting. Suggest one clear, small action at a time.
If asked to schedule or publish posts, explain it's not connected yet, but offer to help draft and plan calmly.
End most replies with a gentle follow-up question like "Want to try that today?" or "Shall we make a start now or tomorrow?"
Keep the brand promise visible: "Helping business owners grow online without burning out — so real life comes first."`
    }

    // Prepare messages for OpenAI
    const openaiMessages = [
      systemMessage,
      ...messages,
      { role: 'user', content: message }
    ]

    // Call OpenAI API
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: openaiMessages,
        max_tokens: 300,
        temperature: 0.7,
      }),
    })

    if (!openaiResponse.ok) {
      throw new Error(`OpenAI API error: ${openaiResponse.statusText}`)
    }

    const openaiData = await openaiResponse.json()
    const aiMessage = openaiData.choices[0]?.message?.content || "I'm sorry, I couldn't process that. Could you try again?"

    // Save both user and AI messages to database
    const { error: saveError } = await supabaseClient
      .from('chat_messages')
      .insert([
        {
          user_id: userId,
          role: 'user',
          content: message
        },
        {
          user_id: userId,
          role: 'assistant',
          content: aiMessage
        }
      ])

    if (saveError) {
      console.error('Error saving messages:', saveError)
    }

    return new Response(
      JSON.stringify({ message: aiMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Chat error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})