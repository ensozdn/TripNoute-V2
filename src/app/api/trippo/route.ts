import { GoogleGenAI } from '@google/genai';
import { NextRequest, NextResponse } from 'next/server';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

const TRIPPO_SYSTEM = `Sen TripNoute'un yapay zeka seyahat asistanı Trippo'sun.

KİŞİLİĞİN:
- Deneyimli bir gezgin gibi konuşursun — samimi, net, gereksiz yere şakacı değil
- Turistik klişelerden kaçınırsın, gerçekten işe yarar bilgiler verirsin
- Türkçe konuşursun, emoji kullanmazsın
- Cevapların kısa ve özlüdür — maksimum 3-4 cümle
- Seyahat planlaması, destinasyon önerileri, bütçe, lojistik konularında uzmansın

KURALLARIN:
- "Tabii ki!", "Harika!", "Kesinlikle!" gibi dolgu ifadeler kullanma
- Her cevabı listeyle başlatma, bazen düz paragraf yaz
- Bilmediğin bir şeyi biliyormuş gibi uydurma, dürüst ol
- Kullanıcının sorduğu şeye direkt cevap ver`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, payload } = body;

    if (type === 'place_info') {
      const { placeName, lat, lng } = payload;
      const prompt = `"${placeName}" hakkında gezginlere özel 3 kısa bilgi ver.
Koordinatlar: ${lat}, ${lng}

Kurallar:
- Turistik rehberlerde yazılmayan, pratik detaylar olsun
- Her madde max 1-2 cümle, emoji yok
- Türkçe yaz
- JSON formatında döndür: { "tips": ["tip1", "tip2", "tip3"], "vibe": "Bu yerin atmosferini 4-5 kelimeyle özetle" }`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { systemInstruction: TRIPPO_SYSTEM },
      });

      const text = response.text;
      try {
        const jsonMatch = text?.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return NextResponse.json({ success: true, data: parsed });
        }
      } catch {
        // JSON parse başarısız
      }
      return NextResponse.json({ success: true, data: { text } });

    } else if (type === 'chat') {
      const { message, context, history } = payload;

      // Önceki mesajları Gemini'nin beklediği formata çevir
      const contents: { role: string; parts: { text: string }[] }[] = [];

      if (history && Array.isArray(history)) {
        for (const msg of history) {
          contents.push({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.text }],
          });
        }
      }

      // Mevcut mesajı ekle
      const fullMessage = context
        ? `[Kullanıcı bağlamı: ${context}]\n\n${message}`
        : message;

      contents.push({ role: 'user', parts: [{ text: fullMessage }] });

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents,
        config: { systemInstruction: TRIPPO_SYSTEM },
      });

      return NextResponse.json({ success: true, data: { text: response.text } });

    } else if (type === 'generate_itinerary') {
      // -----------------------------------------------------------------------
      // Bir destinasyon için planned step listesi üretir.
      // Dönen format: { steps: [{ name, lat, lng, notes, order }] }
      // -----------------------------------------------------------------------
      const { destination, startDate, endDate, days } = payload;
      const dayCount = days || (startDate && endDate
        ? Math.max(1, Math.round((new Date(endDate as string).getTime() - new Date(startDate as string).getTime()) / 86400000))
        : 3);

      const prompt = `"${destination}" için ${dayCount} günlük seyahat planı oluştur.

KURALLAR:
- Her gün için 2-4 durak öner
- Her durak için gerçek koordinatlar ver (lat, lng)
- Mantıklı bir coğrafi sıra izle (yakın yerler art arda)
- Sadece aşağıdaki JSON formatını döndür, başka hiçbir şey yazma

JSON FORMAT:
{
  "steps": [
    { "order": 0, "name": "Yer Adı", "lat": 41.0082, "lng": 28.9784, "notes": "Kısa pratik not", "day": 1 },
    ...
  ]
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { systemInstruction: TRIPPO_SYSTEM },
      });

      const text = response.text ?? '';
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return NextResponse.json({ error: 'Itinerary parse hatası' }, { status: 500 });
      }
      const parsed = JSON.parse(jsonMatch[0]);

      // status: 'planned' damgasını her adıma bas
      const steps = (parsed.steps as any[]).map((s: any, i: number) => ({
        ...s,
        order: i,
        status: 'planned',
      }));

      return NextResponse.json({ success: true, data: { steps } });

    } else {
      return NextResponse.json({ error: 'Unknown type' }, { status: 400 });
    }

  } catch (error) {
    console.error('[Trippo API Error]', error);
    return NextResponse.json({ error: 'Trippo şu an müsait değil, birazdan tekrar dene.' }, { status: 500 });
  }
}
