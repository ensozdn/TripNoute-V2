import { GoogleGenAI } from '@google/genai';
import { NextRequest, NextResponse } from 'next/server';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, payload } = body;

    let prompt = '';

    if (type === 'place_info') {
      const { placeName, lat, lng } = payload;
      prompt = `Sen TripNoute uygulamasının yapay zeka rehberi Trippo'sun. Samimi, enerjik ve seyahat tutkunu birisin.
      
"${placeName}" (koordinatlar: ${lat}, ${lng}) hakkında gezginlere özel 3 kısa ve vurucu bilgi ver.
- Turistik rehberlerde yazılmayan, gizli kalmış detaylar olsun
- Her madde max 1-2 cümle
- Türkçe yaz
- Emoji kullan
- JSON formatında döndür: { "tips": ["tip1", "tip2", "tip3"], "vibe": "Bu yerin genel atmosferini 5 kelimeyle özetle" }`;

    } else if (type === 'chat') {
      const { message, context } = payload;
      prompt = `Sen TripNoute uygulamasının yapay zeka seyahat rehberi Trippo'sun. Samimi, enerjik ve seyahat tutkunu birisin. Kısa ve net cevaplar ver, maksimum 3-4 cümle. Türkçe konuş.
      
${context ? `Kullanıcının mevcut rotası: ${context}\n` : ''}
Kullanıcı: ${message}
Trippo:`;

    } else {
      return NextResponse.json({ error: 'Unknown type' }, { status: 400 });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const text = response.text;

    if (type === 'place_info') {
      try {
        const jsonMatch = text?.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return NextResponse.json({ success: true, data: parsed });
        }
      } catch {
        // JSON parse başarısız, raw text döndür
      }
    }

    return NextResponse.json({ success: true, data: { text } });

  } catch (error) {
    console.error('[Trippo API Error]', error);
    return NextResponse.json({ error: 'Trippo şu an müsait değil, birazdan tekrar dene.' }, { status: 500 });
  }
}
