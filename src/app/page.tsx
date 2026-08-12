import PictoPoemPage from '@/components/features/picto-poem-page';
import type { Metadata } from 'next';

export const maxDuration = 60;

export const metadata: Metadata = {
  title: 'PictoPoem - Image to Poem & Song',
  description: 'Turn your images into beautiful poems and songs using AI. Upload an image, generate a poem, and create a song from the lyrics.',
};


export default function Home() {
  return <PictoPoemPage />;
}
