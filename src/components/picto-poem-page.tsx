"use client";

import type { ChangeEvent } from 'react';
import React, { useState, useTransition } from 'react';
import Image from 'next/image';
import { generatePoemFromImage } from '@/ai/flows/generate-poem-from-image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, Image as ImageIcon } from 'lucide-react';
import { readFileAsDataURI } from '@/lib/utils'; // Import helper function

export default function PictoPoemPage() {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageDataUri, setImageDataUri] = useState<string | null>(null);
  const [poem, setPoem] = useState<string>('');
  const [styleDescription, setStyleDescription] = useState<string>('');
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleImageChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check if the file is an image
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Invalid File Type',
          description: 'Please upload an image file (e.g., JPG, PNG, GIF).',
          variant: 'destructive',
        });
        setImagePreview(null);
        setImageDataUri(null);
        event.target.value = ''; // Reset file input
        return;
      }

      // Check file size (e.g., limit to 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB in bytes
      if (file.size > maxSize) {
         toast({
          title: 'File Too Large',
          description: `Please upload an image smaller than ${maxSize / 1024 / 1024}MB.`,
          variant: 'destructive',
        });
        setImagePreview(null);
        setImageDataUri(null);
        event.target.value = ''; // Reset file input
        return;
      }


      try {
        const dataUri = await readFileAsDataURI(file);
        setImagePreview(URL.createObjectURL(file));
        setImageDataUri(dataUri);
        setPoem(''); // Clear previous poem when new image is selected
      } catch (error) {
        console.error('Error reading file:', error);
        toast({
          title: 'Error Reading File',
          description: 'Could not read the selected image file.',
          variant: 'destructive',
        });
        setImagePreview(null);
        setImageDataUri(null);
      }
    }
  };

  const handleUseSampleImage = () => {
    const sampleImageUrl = 'https://picsum.photos/seed/pictopoem/600/400';
    const sampleImageHint = "landscape nature"; // AI hint for the sample image

    // To get the data URI, we need to fetch the image and convert it.
    // This is an approximation as fetching and converting in the browser has limitations (CORS, etc.).
    // For a robust solution, consider a server-side endpoint or pre-converting the sample.
    // For now, we'll use the URL directly for preview and a placeholder data URI logic (might fail).
    setImagePreview(sampleImageUrl);

    // Placeholder data URI generation (replace with actual fetch/conversion if feasible)
    // This fetch might be blocked by CORS depending on picsum.photos headers
    fetch(sampleImageUrl)
      .then(response => response.blob())
      .then(blob => readFileAsDataURI(blob))
      .then(dataUri => setImageDataUri(dataUri))
      .catch(error => {
        console.error("Error fetching/converting sample image:", error);
        toast({
          title: "Error Loading Sample",
          description: "Could not load the sample image data. Please try uploading an image.",
          variant: "destructive",
        });
        // Fallback: Keep preview, but disable generation
        setImageDataUri(null);
      });

    setPoem(''); // Clear previous poem
    setStyleDescription(''); // Clear style description
  };


  const handleSubmit = () => {
    if (!imageDataUri) {
      toast({
        title: 'No Image Selected',
        description: 'Please upload or select an image first.',
        variant: 'destructive',
      });
      return;
    }

    startTransition(async () => {
      try {
        const result = await generatePoemFromImage({
          photoDataUri: imageDataUri,
          styleDescription: styleDescription || undefined, // Send undefined if empty
        });
        setPoem(result.poem);
        toast({
          title: 'Poem Generated!',
          description: 'Your poem is ready.',
        });
      } catch (error) {
        console.error('Error generating poem:', error);
        toast({
          title: 'Error Generating Poem',
          description: 'Something went wrong. Please try again.',
          variant: 'destructive',
        });
        setPoem(''); // Clear poem on error
      }
    });
  };

  return (
    <div className="container mx-auto p-4 md:p-8 min-h-screen flex flex-col items-center bg-secondary">
      <Card className="w-full max-w-4xl shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl md:text-4xl font-bold text-primary">PictoPoem</CardTitle>
          <CardDescription className="text-muted-foreground">Turn your images into beautiful poems</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          {/* Image Section */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">1. Choose Your Image</h2>
            <div className="aspect-video w-full bg-muted rounded-lg overflow-hidden flex items-center justify-center border border-dashed">
              {imagePreview ? (
                <Image
                  src={imagePreview}
                  alt="Selected preview"
                  width={600}
                  height={400}
                  className="object-contain w-full h-full"
                  data-ai-hint="user uploaded image" // Generic hint
                />
              ) : (
                <div className="text-center text-muted-foreground p-4">
                  <ImageIcon className="mx-auto h-12 w-12 mb-2" />
                  <p>Upload an image or use a sample</p>
                </div>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
               <Label htmlFor="image-upload" className="flex-1">
                 <Button asChild variant="outline" className="w-full cursor-pointer">
                    <span><Upload className="mr-2" /> Upload Image</span>
                 </Button>
                 <Input id="image-upload" type="file" accept="image/*" onChange={handleImageChange} className="sr-only" />
               </Label>
              <Button variant="outline" onClick={handleUseSampleImage} className="flex-1">
                Use Sample Image
              </Button>
            </div>
          </div>

          {/* Poem Section */}
          <div className="space-y-4">
             <h2 className="text-xl font-semibold text-foreground">2. Describe the Style (Optional)</h2>
             <Textarea
              placeholder="e.g., Haiku, free verse, melancholic, joyful..."
              value={styleDescription}
              onChange={(e) => setStyleDescription(e.target.value)}
              className="min-h-[60px]"
              disabled={isPending}
            />

            <h2 className="text-xl font-semibold text-foreground">3. Generate Poem</h2>
             <Button
              onClick={handleSubmit}
              disabled={!imageDataUri || isPending}
              className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
              aria-label="Generate Poem"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...
                </>
              ) : (
                'Generate Poem'
              )}
            </Button>

            {poem && (
              <div className="mt-6 space-y-2">
                 <h2 className="text-xl font-semibold text-foreground">Generated Poem</h2>
                <Card className="bg-card border p-4 rounded-md shadow-inner min-h-[150px]">
                  <p className="whitespace-pre-wrap font-serif text-foreground">{poem}</p>
                </Card>
              </div>
            )}
             {!poem && !isPending && imageDataUri && (
                 <div className="mt-6 text-center text-muted-foreground p-4 border border-dashed rounded-lg min-h-[150px] flex items-center justify-center">
                     <p>Click "Generate Poem" to create poetry from your image.</p>
                 </div>
             )}
          </div>
        </CardContent>
         <CardFooter className="text-center text-muted-foreground text-sm pt-6">
            Powered by Generative AI
        </CardFooter>
      </Card>
    </div>
  );
}
