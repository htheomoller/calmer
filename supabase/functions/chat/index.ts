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
      content: `You are Calmer, a supportive AI companion helping small business owners build healthier social media habits. 

Your personality:
- Calm, encouraging, and relatable
- Mirror the user's tone while staying supportive
- Use short, natural sentences
- Avoid sounding robotic

Your purpose:
- Help users escape digital burnout
- Guide them through a gentle onboarding quiz to personalize their daily plan
- Offer support and encouragement
- Focus on intentional, mindful social media use

During onboarding, ask about:
1. Business name and type
2. Current social media platforms they use
3. How often they currently post
4. Their biggest social media challenge
5. What they want to achieve

Keep responses conversational and under 100 words. Ask one question at a time.`
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
        model: 'gpt-4',
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