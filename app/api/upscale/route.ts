import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const image = formData.get('image') as File | null;
    const targetWidth = parseInt(formData.get('targetWidth') as string) || 800;
    const targetHeight = parseInt(formData.get('targetHeight') as string) || 600;

    if (!image) {
      return NextResponse.json(
        { error: 'No image provided' },
        { status: 400 }
      );
    }

    const apiFormData = new FormData();
    apiFormData.append('image_file', image);
    apiFormData.append('target_width', targetWidth.toString());
    apiFormData.append('target_height', targetHeight.toString());

    const response = await fetch('https://clipdrop-api.co/image-upscaling/v1/upscale', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.CLIPDROP_API_KEY!,
      },
      body: apiFormData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `Upscale API error: ${errorText}` },
        { status: response.status }
      );
    }

    const arrayBuffer = await response.arrayBuffer();

    return new NextResponse(arrayBuffer, {
      headers: {
        'Content-Type': 'image/png',
      },
    });
  } catch (error) {
    console.error('Upscale API error:', error);
    return NextResponse.json(
      { error: 'Failed to upscale image' },
      { status: 500 }
    );
  }
}
