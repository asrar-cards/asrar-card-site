// نقطة الربط بـ GPT Image 2 — هذا الملف يشتغل على سيرفر نتليفاي، لا داخل المتصفح
// المفتاح يقرأه من Environment Variable اسمه OPENAI_API_KEY (لا يكتب هنا أبدًا)

export default async (request) => {
  try {
    const { prompt, size, photo } = await request.json();

    if (!prompt) {
      return new Response(JSON.stringify({ error: 'النص مطلوب' }), { status: 400 });
    }

    const apiSize = '1024x1536'; // مقاس عمودي مناسب لكل أنواع البطاقات حاليًا
    let response;

    if (photo) {
      // حالة وجود صورة المستخدم: نستخدم images.edit لدمجها بالتصميم
      const base64Data = photo.split(',')[1];
      const buffer = Buffer.from(base64Data, 'base64');
      const blob = new Blob([buffer], { type: 'image/png' });
      const form = new FormData();
      form.append('model', 'gpt-image-2');
      form.append('image', blob, 'photo.png');
      form.append('prompt', prompt);
      form.append('size', apiSize);
      form.append('quality', 'medium');

      response = await fetch('https://api.openai.com/v1/images/edits', {
        method: 'POST',
        headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
        body: form
      });
    } else {
      // بدون صورة: توليد نصي مباشر
      response = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ model: 'gpt-image-2', prompt, size: apiSize, quality: 'medium' })
      });
    }

    const data = await response.json();

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: data.error?.message || 'فشل التوليد من OpenAI' }),
        { status: 500 }
      );
    }

    const b64 = data.data[0].b64_json;
    return new Response(JSON.stringify({ image: `data:image/png;base64,${b64}` }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};
