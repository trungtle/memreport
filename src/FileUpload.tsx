import { ChangeEvent, useState } from 'react';

function FileUpload({ setLinesArray }: { setLinesArray: (lines: string[]) => void }) {
  const [file, setFile] = useState<File>();

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
      if (e.target.files[0]) {
        readFileInChunks(e.target.files[0]);
      }
    }
  };

  const readFileInChunks = async (f: File) => {
    const CHUNK_SIZE = 1024 * 1024; // 1MB chunk size
    const fileReader = new FileReader();
    let offset = 0;
    let newLinesArray : string[] = [];
    fileReader.onload = async (e) => { 
      const text = e.target!.result as string;
      newLinesArray = newLinesArray.concat(text.split('\n'));
      setLinesArray(newLinesArray);

      offset += CHUNK_SIZE;
      if (offset < f.size) {
        readNextChunk();
      }
    };

    const readNextChunk = () => {
      const blob = f.slice(offset, offset + CHUNK_SIZE);
      fileReader.readAsText(blob);
    };

    readNextChunk();
  } 

  return (
    <div>
      <input 
        type="file" 
        name=".memreport"
        accept=".txt, .memreport"
        onChange={handleFileChange} />

      <div>{file && `${file.name}`}</div>
    </div>
  );
}

export default FileUpload;
