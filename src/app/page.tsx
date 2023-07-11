import { Editor } from "@/components/Editor";
import { Button } from "@/components/ui/Button";

export default function Home() {
  return <div>
    <Editor/>
    <div className='w-full flex justify-end'>
        <Button type='submit' className='w-full' form='note-post-form'>
          Save
        </Button>
      </div>
    </div>
}
