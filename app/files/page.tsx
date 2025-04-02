'use client';

import { useFiles } from '@/components/QueryClientContextProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function FilesPage() {
  const supabase = createClient();
  const router = useRouter();
  const [selectedDocument, setSelectedDocument] = useState<number>()
  const [isGenerating, setIsGenerating] = useState(false)

  const { status, data: documents, error, isFetching } = useFiles(supabase)

  return (
    <div className=" m-4 sm:m-10 flex flex-col gap-8 grow items-stretch">
      <div className="h-40 flex flex-col justify-center items-center border-b pb-8">
        <Input
          type="file"
          name="file"
          className="cursor-pointer w-full max-w-xs"
          onChange={async (e) => {
            const selectedFile = e.target.files?.[0];

            if (selectedFile) {
              const { error } = await supabase.storage
                .from('files')
                .upload(
                  `${crypto.randomUUID()}/${selectedFile.name}`,
                  selectedFile
                );

              if (error) {
                toast({
                  variant: 'destructive',
                  description:
                    'There was an error uploading the file. Please try again.',
                });
                return;
              }

              // router.push('/chat');
            }
          }}
        />
      </div>

      {documents && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
          {documents.map((document) => (
            <div
              key={document.id}
              className={`flex flex-col gap-2 justify-center items-center border rounded-md p-4 sm:p-6 text-center overflow-hidden cursor-pointer hover:bg-slate-800 text-white ${selectedDocument === document.id ? '!border-white' : ''}`}
              onClick={() => {
                setSelectedDocument(document.id)
                // if (!document.storage_object_path) {
                //   toast({
                //     variant: 'destructive',
                //     description: 'Failed to download file, please try again.',
                //   });
                //   return;
                // }

                // const { data, error } = await supabase.storage
                //   .from('files')
                //   .createSignedUrl(document.storage_object_path, 60);

                // if (error) {
                //   toast({
                //     variant: 'destructive',
                //     description: 'Failed to download file. Please try again.',
                //   });
                //   return;
                // }

                // globalThis.location.href = data.signedUrl;
              }}
            >
              <svg
                className='bg-white '
                width="50px"
                height="50px"
                version="1.1"
                viewBox="0 0 100 100"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="m82 31.199c0.10156-0.60156-0.10156-1.1992-0.60156-1.6992l-24-24c-0.39844-0.39844-1-0.5-1.5977-0.5h-0.19922-31c-3.6016 0-6.6016 3-6.6016 6.6992v76.5c0 3.6992 3 6.6992 6.6016 6.6992h50.801c3.6992 0 6.6016-3 6.6016-6.6992l-0.003906-56.699v-0.30078zm-48-7.1992h10c1.1016 0 2 0.89844 2 2s-0.89844 2-2 2h-10c-1.1016 0-2-0.89844-2-2s0.89844-2 2-2zm32 52h-32c-1.1016 0-2-0.89844-2-2s0.89844-2 2-2h32c1.1016 0 2 0.89844 2 2s-0.89844 2-2 2zm0-16h-32c-1.1016 0-2-0.89844-2-2s0.89844-2 2-2h32c1.1016 0 2 0.89844 2 2s-0.89844 2-2 2zm0-16h-32c-1.1016 0-2-0.89844-2-2s0.89844-2 2-2h32c1.1016 0 2 0.89844 2 2s-0.89844 2-2 2zm-8-15v-17.199l17.199 17.199z" />
              </svg>

              {document.name}
            </div>
          ))}
        </div>
      )}
      <Button className='w-[300px]' onClick={async () => {
        if (!selectedDocument) {
          // Show an error or alert that no document is selected
          alert("Please select a document first");
          return;
        }

        setIsGenerating(true);

        try {
          const response = await fetch('/api/embed', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ document_id: selectedDocument })
          })

          if (!response.ok) {
            throw new Error('Failed to generate embeddings');
          }

          alert("Embeddings generated successfully!");
        } catch (error) {
          console.error('Error generating embeddings:', error);
          alert("Error generating embeddings. Please check console for details.");
        } finally {
          setIsGenerating(false);
        }
      }}
        disabled={!selectedDocument || isGenerating}>
        {isGenerating ? 'Generating...' : 'Generate Embeddings'}
      </Button>
    </div>

  );
}