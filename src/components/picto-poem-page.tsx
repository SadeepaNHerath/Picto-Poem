
"use client";

import type { ChangeEvent } from 'react';
import React, { useState, useTransition } from 'react';
import Image from 'next/image';
import { generatePoemFromImage } from '@/ai/flows/generate-poem-from-image';
import { generateSongFromPoem } from '@/ai/flows/generate-song-from-poem'; // Import the new flow
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, Image as ImageIcon, Music, Play } from 'lucide-react';
import { readFileAsDataURI } from '@/lib/utils'; // Import helper function

export default function PictoPoemPage() {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageDataUri, setImageDataUri] = useState<string | null>(null);
  const [poem, setPoem] = useState<string>('');
  const [styleDescription, setStyleDescription] = useState<string>('');
  const [songUrl, setSongUrl] = useState<string | null>(null); // State for song URL
  const [isPoemPending, startPoemTransition] = useTransition();
  const [isSongPending, startSongTransition] = useTransition(); // Transition for song generation
  const { toast } = useToast();

  const resetOutputs = () => {
    setPoem('');
    setSongUrl(null);
  }

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
        resetOutputs();
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
        resetOutputs();
        return;
      }

      try {
        const dataUri = await readFileAsDataURI(file);
        setImagePreview(URL.createObjectURL(file));
        setImageDataUri(dataUri);
        resetOutputs(); // Clear previous poem/song when new image is selected
      } catch (error) {
        console.error('Error reading file:', error);
        toast({
          title: 'Error Reading File',
          description: 'Could not read the selected image file.',
          variant: 'destructive',
        });
        setImagePreview(null);
        setImageDataUri(null);
        resetOutputs();
      }
    }
  };

  const handleUseSampleImage = () => {
    const sampleImageUrl = 'https://picsum.photos/seed/pictopoem/600/400';
    const sampleImageHint = "landscape nature"; // AI hint for the sample image

    setImagePreview(sampleImageUrl);
    resetOutputs(); // Clear previous poem/song
    setStyleDescription(''); // Clear style description

    // Fetch and convert the sample image to data URI
    fetch(sampleImageUrl)
      .then(response => {
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return response.blob();
      })
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
  };

  const handlePoemSubmit = () => {
    if (!imageDataUri) {
      toast({
        title: 'No Image Selected',
        description: 'Please upload or select an image first.',
        variant: 'destructive',
      });
      return;
    }
    resetOutputs(); // Reset poem and song

    startPoemTransition(async () => {
      try {
        const result = await generatePoemFromImage({
          photoDataUri: imageDataUri,
          styleDescription: styleDescription || undefined, // Send undefined if empty
        });
        setPoem(result.poem);
        toast({
          title: 'Poem Generated!',
          description: 'Your poem is ready. Now you can generate a song!',
        });
      } catch (error) {
        console.error('Error generating poem:', error);
        toast({
          title: 'Error Generating Poem',
          description: 'Something went wrong generating the poem. Please try again.',
          variant: 'destructive',
        });
        setPoem(''); // Clear poem on error
      }
    });
  };

  const handleSongSubmit = () => {
      if (!poem) {
        toast({
            title: 'Poem Not Generated',
            description: 'Please generate a poem first before creating a song.',
            variant: 'destructive',
        });
        return;
      }

      setSongUrl(null); // Clear previous song URL

      startSongTransition(async () => {
        try {
            const result = await generateSongFromPoem({
                poem: poem,
                title: `Poem Song - ${new Date().toISOString()}`, // Basic title
                prompt: styleDescription || "song based on poem lyrics", // Use style description if available
            });
            setSongUrl(result.songUrl);
            toast({
                title: 'Song Generated!',
                description: 'Your song is ready to play.',
            });
        } catch (error) {
            console.error('Error generating song:', error);
            toast({
                title: 'Error Generating Song',
                description: `Something went wrong generating the song: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
                variant: 'destructive',
            });
            setSongUrl(null); // Clear song URL on error
        }
      });
  }

  const isGenerating = isPoemPending || isSongPending;

  return (
    <div className="container mx-auto p-4 md:p-8 min-h-screen flex flex-col items-center bg-secondary">
      <Card className="w-full max-w-4xl shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl md:text-4xl font-bold text-primary">PictoPoem</CardTitle>
          <CardDescription className="text-muted-foreground">Turn your images into beautiful poems and songs</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          {/* Image & Style Section */}
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
            <h2 className="text-xl font-semibold text-foreground pt-4">2. Describe the Style (Optional)</h2>
            <Textarea
              placeholder="e.g., Haiku, free verse, melancholic, joyful... (influences poem and song style)"
              value={styleDescription}
              onChange={(e) => setStyleDescription(e.target.value)}
              className="min-h-[60px]"
              disabled={isGenerating}
            />
          </div>

          {/* Generation Section */}
          <div className="space-y-4">
             <h2 className="text-xl font-semibold text-foreground">3. Generate Poem</h2>
             <Button
              onClick={handlePoemSubmit}
              disabled={!imageDataUri || isGenerating}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              aria-label="Generate Poem"
            >
              {isPoemPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating Poem...
                </>
              ) : (
                'Generate Poem'
              )}
            </Button>

            {/* Poem Display */}
            <div className="mt-4 space-y-2">
               <h2 className="text-xl font-semibold text-foreground">Generated Poem</h2>
                {poem && !isPoemPending ? (
                    <Card className="bg-card border p-4 rounded-md shadow-inner min-h-[150px]">
                    <p className="whitespace-pre-wrap font-serif text-foreground">{poem}</p>
                    </Card>
                 ) : !poem && !isPoemPending && imageDataUri ? (
                    <div className="text-center text-muted-foreground p-4 border border-dashed rounded-lg min-h-[150px] flex items-center justify-center">
                        <p>Click "Generate Poem" to create poetry from your image.</p>
                    </div>
                 ) : isPoemPending ? (
                    <div className="text-center text-muted-foreground p-4 border border-dashed rounded-lg min-h-[150px] flex items-center justify-center">
                        <Loader2 className="mr-2 h-6 w-6 animate-spin" /> <p>Generating poem...</p>
                    </div>
                 ): (
                     <div className="text-center text-muted-foreground p-4 border border-dashed rounded-lg min-h-[150px] flex items-center justify-center">
                         <p>Poem will appear here.</p>
                     </div>
                 )
                }
             </div>

             {/* Song Generation */}
             <div className="mt-6 space-y-2">
                 <h2 className="text-xl font-semibold text-foreground">4. Generate Song</h2>
                <Button
                    onClick={handleSongSubmit}
                    disabled={!poem || isGenerating}
                    className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
                    aria-label="Generate Song"
                >
                {isSongPending ? (
                    <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating Song...
                    </>
                ) : (
                   <> <Music className="mr-2 h-4 w-4"/> Generate Song from Poem</>
                )}
                </Button>

                {/* Song Player */}
                {songUrl && !isSongPending ? (
                     <Card className="bg-card border p-4 rounded-md shadow-inner">
                        <h3 className="text-lg font-medium mb-2 flex items-center"><Play className="mr-2 h-5 w-5"/> Play Song</h3>
                        <audio controls src={songUrl} className="w-full">
                            Your browser does not support the audio element.
                            <a href={songUrl} download target="_blank" rel="noopener noreferrer">Download Song</a>
                        </audio>
                     </Card>
                ) : !songUrl && !isSongPending && poem ? (
                     <div className="text-center text-muted-foreground p-4 border border-dashed rounded-lg min-h-[80px] flex items-center justify-center">
                         <p>Click "Generate Song" to turn the poem into music.</p>
                     </div>
                ) : isSongPending ? (
                     <div className="text-center text-muted-foreground p-4 border border-dashed rounded-lg min-h-[80px] flex items-center justify-center">
                        <Loader2 className="mr-2 h-6 w-6 animate-spin" /> <p>Generating song...</p>
                     </div>
                 ) : (
                    <div className="text-center text-muted-foreground p-4 border border-dashed rounded-lg min-h-[80px] flex items-center justify-center">
                         <p>Song player will appear here.</p>
                     </div>
                 )
                }
             </div>
          </div>
        </CardContent>
         <CardFooter className="text-center text-muted-foreground text-sm pt-6">
            Poem by Generative AI, Song by TopMediai
        </CardFooter>
      </Card>
    </div>
  );
}
```