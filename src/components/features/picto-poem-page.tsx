"use client";

import type { ChangeEvent, FormEvent } from "react"; // Added FormEvent
import React, { useState, useTransition, useRef, useEffect } from "react"; // Added useRef, useEffect
import Image from "next/image";
import {
  generatePoemFromImage,
  GeneratePoemFromImageInput,
} from "@/ai/flows/generate-poem-from-image";
import {
  generateSongFromPoem,
  GenerateSongFromPoemInput,
} from "@/ai/flows/generate-song-from-poem";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  Upload,
  Image as ImageIcon,
  Music,
  Play,
  FileWarning,
  Info,
} from "lucide-react";
import { readFileAsDataURI } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"; // Import Alert components

// Constants for Limits
const MAX_IMAGE_SIZE_MB = 5;
const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;

export default function PictoPoemPage() {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageDataUri, setImageDataUri] = useState<string | null>(null);
  const [poem, setPoem] = useState<string>("");
  const [styleDescription, setStyleDescription] = useState<string>("");
  const [songUrl, setSongUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null); // Consolidated error state

  const [isPoemPending, startPoemTransition] = useTransition();
  const [isSongPending, startSongTransition] = useTransition();

  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null); // Ref for file input
  const audioRef = useRef<HTMLAudioElement>(null); // Ref for audio element

  // Clear errors and outputs when inputs change
  useEffect(() => {
    setError(null);
    setPoem("");
    setSongUrl(null);
    if (audioRef.current) {
      audioRef.current.pause(); // Stop audio if playing
      audioRef.current.currentTime = 0;
    }
  }, [imageDataUri, styleDescription]);

  const handleImageChange = async (event: ChangeEvent<HTMLInputElement>) => {
    setError(null); // Clear previous errors
    const file = event.target.files?.[0];

    if (!file) {
      setImagePreview(null);
      setImageDataUri(null);
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError(
        `Invalid file type. Please upload an image (JPG, PNG, GIF, etc.).`,
      );
      toast({
        title: "Invalid File Type",
        description: "Please upload an image file.",
        variant: "destructive",
      });
      setImagePreview(null);
      setImageDataUri(null);
      if (fileInputRef.current) fileInputRef.current.value = ""; // Reset file input
      return;
    }

    // Validate file size
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      setError(
        `Image too large. Please upload an image smaller than ${MAX_IMAGE_SIZE_MB}MB.`,
      );
      toast({
        title: "File Too Large",
        description: `Image must be smaller than ${MAX_IMAGE_SIZE_MB}MB.`,
        variant: "destructive",
      });
      setImagePreview(null);
      setImageDataUri(null);
      if (fileInputRef.current) fileInputRef.current.value = ""; // Reset file input
      return;
    }

    // Read and set image data
    try {
      const dataUri = await readFileAsDataURI(file);
      setImagePreview(URL.createObjectURL(file)); // Use object URL for preview efficiency
      setImageDataUri(dataUri);
    } catch (err) {
      console.error("Error reading file:", err);
      const message =
        err instanceof Error ? err.message : "Could not read the image file.";
      setError(`Error reading file: ${message}`);
      toast({
        title: "Error Reading File",
        description: message,
        variant: "destructive",
      });
      setImagePreview(null);
      setImageDataUri(null);
    }
  };

  // Clean up Object URL when component unmounts or image changes
  useEffect(() => {
    const currentPreview = imagePreview;
    return () => {
      if (currentPreview && currentPreview.startsWith("blob:")) {
        URL.revokeObjectURL(currentPreview);
      }
    };
  }, [imagePreview]);

  const handleUseSampleImage = () => {
    setError(null);
    const sampleImageUrl = "https://picsum.photos/seed/pictopoem/600/400";
    // Use a temporary placeholder while fetching
    setImagePreview("/placeholder-image.svg"); // Assuming a simple placeholder SVG exists
    setImageDataUri(null); // Clear data URI while fetching
    setStyleDescription(""); // Clear style description

    toast({ title: "Loading Sample Image...", description: "Please wait." });

    fetch(sampleImageUrl)
      .then((response) => {
        if (!response.ok)
          throw new Error(`HTTP error! status: ${response.status}`);
        return response.blob();
      })
      .then((blob) => {
        if (blob.size > MAX_IMAGE_SIZE_BYTES) {
          throw new Error(
            `Sample image is too large (${(blob.size / 1024 / 1024).toFixed(1)}MB). Max ${MAX_IMAGE_SIZE_MB}MB allowed.`,
          );
        }
        if (!blob.type.startsWith("image/")) {
          throw new Error(
            `Sample image is not a valid image type (${blob.type}).`,
          );
        }
        return readFileAsDataURI(blob);
      })
      .then((dataUri) => {
        // Successfully loaded and converted
        setImagePreview(sampleImageUrl); // Set actual preview URL
        setImageDataUri(dataUri);
        toast({
          title: "Sample Image Loaded",
          description: "Ready to generate poem.",
        });
      })
      .catch((error) => {
        console.error("Error fetching/converting sample image:", error);
        const message =
          error instanceof Error
            ? error.message
            : "Could not load the sample image data.";
        setError(`Error loading sample: ${message}`);
        toast({
          title: "Error Loading Sample",
          description: message,
          variant: "destructive",
        });
        // Clear preview and data if fetch fails
        setImagePreview(null);
        setImageDataUri(null);
      });
  };

  const handlePoemSubmit = (event: FormEvent) => {
    event.preventDefault(); // Prevent default form submission
    if (!imageDataUri) {
      setError("Please upload or select an image first.");
      toast({
        title: "No Image Selected",
        description: "An image is required to generate a poem.",
        variant: "destructive",
      });
      return;
    }
    setError(null);
    setPoem(""); // Reset poem
    setSongUrl(null); // Reset song as well

    startPoemTransition(async () => {
      try {
        const input: GeneratePoemFromImageInput = {
          photoDataUri: imageDataUri,
          ...(styleDescription && { styleDescription }), // Only include if not empty
        };
        const result = await generatePoemFromImage(input);
        setPoem(result.poem);
        toast({
          title: "Poem Generated!",
          description: "Your poem is ready. You can now generate a song!",
        });
      } catch (err) {
        console.error("Error generating poem:", err);
        const message =
          err instanceof Error ? err.message : "An unknown error occurred.";
        setError(`Error generating poem: ${message}`);
        toast({
          title: "Poem Generation Failed",
          description: message,
          variant: "destructive",
        });
        setPoem(""); // Ensure poem is cleared on error
      }
    });
  };

  const handleSongSubmit = () => {
    // No event needed as it's triggered by button click
    if (!poem) {
      setError("Please generate a poem first before creating a song.");
      toast({
        title: "Poem Not Available",
        description: "A poem is required to generate a song.",
        variant: "destructive",
      });
      return;
    }
    setError(null);
    setSongUrl(null); // Clear previous song URL

    startSongTransition(async () => {
      try {
        const input: GenerateSongFromPoemInput = {
          poem: poem,
          title: `Song for Poem - ${new Date().toLocaleTimeString()}`, // More user-friendly title
          // Use style description as prompt, fallback to generic
          prompt: styleDescription || "melodious song based on provided lyrics",
        };
        const result = await generateSongFromPoem(input);
        setSongUrl(result.songUrl);
        toast({
          title: "Song Generated!",
          description: "Your song with vocals is ready to play.",
        });
      } catch (err) {
        console.error("Error generating song:", err);
        const message =
          err instanceof Error ? err.message : "An unknown error occurred.";
        setError(`Error generating song: ${message}`);
        toast({
          title: "Song Generation Failed",
          description: message,
          variant: "destructive",
        });
        setSongUrl(null); // Clear song URL on error
      }
    });
  };

  const isGenerating = isPoemPending || isSongPending;

  return (
    <main className="container mx-auto p-4 md:p-8 min-h-screen flex flex-col items-center bg-secondary/50">
      <Card className="w-full max-w-4xl shadow-lg rounded-xl overflow-hidden">
        <CardHeader className="text-center bg-card p-6 border-b">
          <div className="flex flex-col items-center gap-3">
            <img
              src="/logo.svg"
              alt="PictoPoem logo"
              width={64}
              height={64}
              className="rounded-2xl shadow-sm"
            />
            <CardTitle className="text-3xl md:text-4xl font-bold text-primary">
              PictoPoem
            </CardTitle>
          </div>
          <CardDescription className="text-muted-foreground mt-1">
            Turn your images into beautiful poems and songs with AI
          </CardDescription>
        </CardHeader>
        {error && (
          <Alert variant="destructive" className="m-4 md:m-6 rounded-md">
            <FileWarning className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {/* Outer form for image upload and poem generation */}
        <form onSubmit={handlePoemSubmit}>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 p-4 md:p-6">
            {/* Left Column: Image & Style */}
            <div className="space-y-4 flex flex-col">
              <section aria-labelledby="image-section-title">
                <h2
                  id="image-section-title"
                  className="text-xl font-semibold text-foreground mb-2"
                >
                  1. Choose Your Image
                </h2>
                <div className="aspect-video w-full bg-muted rounded-lg overflow-hidden flex items-center justify-center border border-dashed border-input relative">
                  {imagePreview ? (
                    <Image
                      src={imagePreview}
                      alt="Selected image preview"
                      fill // Use fill for responsive container
                      className="object-contain" // Contain ensures image fits
                      data-ai-hint="user uploaded image visual content"
                    />
                  ) : (
                    <div className="text-center text-muted-foreground p-4 flex flex-col items-center justify-center">
                      <ImageIcon className="h-12 w-12 mb-2 opacity-50" />
                      <p className="text-sm">Upload an image or use a sample</p>
                      <p className="text-xs mt-1">
                        (Max {MAX_IMAGE_SIZE_MB}MB)
                      </p>
                    </div>
                  )}
                </div>
                <div className="flex flex-col sm:flex-row gap-2 mt-3">
                  <Label
                    htmlFor="image-upload"
                    className="flex-1 cursor-pointer"
                  >
                    <Button
                      asChild
                      variant="outline"
                      className="w-full"
                      aria-controls="image-upload"
                    >
                      <span>
                        <Upload className="mr-2 h-4 w-4" /> Upload Image
                      </span>
                    </Button>
                    <Input
                      ref={fileInputRef}
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="sr-only" // Hide visually, keep accessible
                      aria-label="Upload image file"
                    />
                  </Label>
                  <Button
                    variant="secondary"
                    onClick={handleUseSampleImage}
                    type="button"
                    className="flex-1"
                  >
                    Use Sample Image
                  </Button>
                </div>
              </section>

              <section
                aria-labelledby="style-section-title"
                className="pt-4 flex-grow flex flex-col"
              >
                <h2
                  id="style-section-title"
                  className="text-xl font-semibold text-foreground mb-2"
                >
                  2. Describe Style (Optional)
                </h2>
                <Label htmlFor="style-description" className="sr-only">
                  Poem and Song Style Description
                </Label>
                <Textarea
                  id="style-description"
                  placeholder="e.g., Haiku, free verse, melancholic, joyful, upbeat pop song, classical instrumental..."
                  value={styleDescription}
                  onChange={(e) => setStyleDescription(e.target.value)}
                  className="min-h-[80px] flex-grow resize-none" // Allow textarea to grow
                  disabled={isGenerating}
                  aria-label="Optional description for poem and song style"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Influences poem structure and song mood/genre.
                </p>
              </section>
            </div>

            {/* Right Column: Generation & Output */}
            <div className="space-y-6 flex flex-col">
              {/* Poem Generation */}
              <section
                aria-labelledby="poem-generation-title"
                className="flex flex-col"
              >
                <h2
                  id="poem-generation-title"
                  className="text-xl font-semibold text-foreground mb-2"
                >
                  3. Generate Poem
                </h2>
                <Button
                  type="submit" // Use submit type for the outer form
                  disabled={!imageDataUri || isGenerating}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                  aria-label={
                    isPoemPending ? "Generating Poem" : "Generate Poem"
                  }
                  aria-live="polite"
                >
                  {isPoemPending ? (
                    <>
                      {" "}
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                      Generating Poem...{" "}
                    </>
                  ) : (
                    "Generate Poem"
                  )}
                </Button>

                {/* Poem Display */}
                <div className="mt-4 flex-grow flex flex-col">
                  <h3 className="text-lg font-medium text-foreground mb-2 sr-only">
                    Generated Poem Output
                  </h3>
                  <div
                    className={`bg-card border p-4 rounded-md shadow-inner min-h-[150px] flex-grow flex ${!poem && !isPoemPending ? "items-center justify-center" : ""} overflow-auto`}
                  >
                    {isPoemPending ? (
                      <div className="text-center text-muted-foreground p-4 flex items-center justify-center w-full">
                        <Loader2 className="mr-2 h-6 w-6 animate-spin" />{" "}
                        <p>Generating poem...</p>
                      </div>
                    ) : poem ? (
                      <p className="whitespace-pre-wrap font-serif text-sm md:text-base text-card-foreground">
                        {poem}
                      </p>
                    ) : imageDataUri ? (
                      <div className="text-center text-muted-foreground p-4 w-full">
                        <Info className="mx-auto h-8 w-8 mb-2 opacity-50" />
                        <p>Click "Generate Poem" above.</p>
                      </div>
                    ) : (
                      <div className="text-center text-muted-foreground p-4 w-full">
                        <Info className="mx-auto h-8 w-8 mb-2 opacity-50" />
                        <p>Upload an image and click "Generate Poem".</p>
                      </div>
                    )}
                  </div>
                </div>
              </section>

              {/* Song Generation - No longer a form */}
              <section
                aria-labelledby="song-generation-title"
                className="flex flex-col"
              >
                <h2
                  id="song-generation-title"
                  className="text-xl font-semibold text-foreground mb-2"
                >
                  4. Generate Song
                </h2>
                <Button
                  type="button" // Change type to button, not submit
                  onClick={handleSongSubmit} // Call handler directly on click
                  disabled={!poem || isGenerating}
                  className="w-full bg-accent text-accent-foreground hover:bg-accent/90 transition-colors"
                  aria-label={
                    isSongPending
                      ? "Generating Song"
                      : "Generate Song from Poem"
                  }
                  aria-live="polite"
                >
                  {isSongPending ? (
                    <>
                      {" "}
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                      Generating Song...{" "}
                    </>
                  ) : (
                    <>
                      {" "}
                      <Music className="mr-2 h-4 w-4" /> Generate Song from Poem
                    </>
                  )}
                </Button>

                {/* Song Player */}
                <div className="mt-4 flex-grow flex flex-col">
                  <h3 className="text-lg font-medium text-foreground mb-2 sr-only">
                    Generated Song Player
                  </h3>
                  <div
                    className={`bg-card border p-4 rounded-md shadow-inner min-h-[80px] flex-grow flex items-center justify-center ${!songUrl && !isSongPending ? "items-center justify-center" : ""} overflow-hidden`}
                  >
                    {isSongPending ? (
                      <div className="text-center text-muted-foreground p-4 flex items-center justify-center w-full">
                        <Loader2 className="mr-2 h-6 w-6 animate-spin" />{" "}
                        <p>Generating song with vocals (1–2 minutes)...</p>
                      </div>
                    ) : songUrl ? (
                      <div className="w-full space-y-2">
                        <h4 className="text-base font-medium flex items-center">
                          <Play className="mr-2 h-5 w-5 text-accent" /> Song
                          Player
                        </h4>
                        <audio
                          ref={audioRef}
                          controls
                          src={songUrl}
                          className="w-full h-10"
                          aria-label="Generated song audio player"
                        >
                          Your browser does not support the audio element.
                          <a
                            href={songUrl}
                            download
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline ml-2"
                          >
                            Download Song
                          </a>
                        </audio>
                      </div>
                    ) : poem ? (
                      <div className="text-center text-muted-foreground p-4 w-full">
                        <Info className="mx-auto h-8 w-8 mb-2 opacity-50" />
                        <p>Click "Generate Song" above.</p>
                      </div>
                    ) : (
                      <div className="text-center text-muted-foreground p-4 w-full">
                        <Info className="mx-auto h-8 w-8 mb-2 opacity-50" />
                        <p>Generate a poem first.</p>
                      </div>
                    )}
                  </div>
                </div>
              </section>
            </div>
          </CardContent>
        </form>{" "}
        {/* Close the outer form */}
        <CardFooter className="text-center text-muted-foreground text-xs p-4 border-t bg-card">
            Poem by Google Gemini via Genkit | Song by ACE-Step (free, with vocals)
        </CardFooter>
      </Card>
      {/* Placeholder for potential additional content below the card */}
      <div className="mt-4 text-center text-muted-foreground text-xs">
        Image generation by Picsum Photos
      </div>
    </main>
  );
}
