'use client'

import EditorJS from '@editorjs/editorjs'
import { zodResolver } from '@hookform/resolvers/zod'
import { usePathname, useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useForm, useWatch  } from 'react-hook-form'
import TextareaAutosize from 'react-textarea-autosize'
import { z } from 'zod'

import { toast } from '@/hooks/use-toast'
// import { uploadFiles } from '@/lib/uploadthing'
import { PostCreationRequest, PostValidator } from '@/lib/validators/post'
import { useMutation } from '@tanstack/react-query'
import axios from 'axios'

import '@/styles/editor.css'

type FormData = z.infer<typeof PostValidator>


export const Editor: React.FC = () => {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(PostValidator),
    defaultValues: {
      title: '',
      content: null,
    },
  })
  const title = useWatch({
    control,
    name: 'title',
    defaultValue: '', // default value
  })
  useEffect(() => {
    document.title = title || "Notetaker"; 
  }, [title]);
  const ref = useRef<EditorJS>()
  const _titleRef = useRef<HTMLTextAreaElement>(null)
  const router = useRouter()
  const [isMounted, setIsMounted] = useState<boolean>(false)
  const pathname = usePathname()

  const { mutate: createPost } = useMutation({
    mutationFn: async ({
      title,
      content,
    }: PostCreationRequest) => {
      const payload: PostCreationRequest = { title, content }
      const { data } = await axios.post('/api/notes/create', payload)
      return data
    },
    onError: () => {
      return toast({
        title: 'Something went wrong.',
        description: 'Your note was not published. Please try again.',
        variant: 'destructive',
      })
    },
    onSuccess: () => {
      
      const newPathname = pathname.split('/').slice(0, -1).join('/')
      router.push(newPathname)

      router.refresh()

      return toast({
        description: 'Your note has been published.',
      })
    },
  })

  

  const initializeEditor = useCallback(async () => {
    const EditorJS = (await import('@editorjs/editorjs')).default
    const Header = (await import('@editorjs/header')).default
    const Embed = (await import('@editorjs/embed')).default
    const Table = (await import('@editorjs/table')).default
    const List = (await import('@editorjs/list')).default
    const Code = (await import('@editorjs/code')).default
    const LinkTool = (await import('@editorjs/link')).default
    const InlineCode = (await import('@editorjs/inline-code')).default
    const ImageTool = (await import('@editorjs/image')).default
    const Quote = (await import('@editorjs/quote')).default
    const NestedList = (await import('@editorjs/nested-list')).default

    if (!ref.current) {
      const editor = new EditorJS({
        holder: 'editor',
        onReady() {
          ref.current = editor
        },
        placeholder: 'Your best ides here...',
        inlineToolbar: true,
        data: { blocks: [] },
        tools: {
          header: {
            class: Header as any,
            inlineToolbar: true,
            config: {
              placeholder: 'Enter a header',
              levels: [1, 2, 3, 4, 5, 6],
              defaultLevel: 3,
            },
          },
          linkTool: {
            class: LinkTool,
            config: {
              endpoint: '/api/link',
            },
          },
          quote: {
            class: Quote,
            inlineToolbar: true,
            config: {
              quotePlaceholder: 'Enter a quote',
              captionPlaceholder: 'Quote\'s author',
            },
          },
          nestedlist: {
            class: NestedList,
            inlineToolbar: true,
            config: {
              defaultStyle: 'unordered'
            },
          },
          // image: {
          //   class: ImageTool,
          //   config: {
          //     uploader: {
          //       async uploadByFile(file: File) {
          //         // upload to uploadthing
          //         const [res] = await uploadFiles([file], 'imageUploader')

          //         return {
          //           success: 1,
          //           file: {
          //             url: res.fileUrl,
          //           },
          //         }
          //       },
          //     },
          //   },
          // },
          list: List,
          code: Code,
          inlineCode: InlineCode,
          table: Table,
          embed: Embed,
        },
      })
    }
  }, [])

  useEffect(() => {
    if (Object.keys(errors).length) {
      for (const [_key, value] of Object.entries(errors)) {
        value
        toast({
          title: 'Something went wrong.',
          description: (value as { message: string }).message,
          variant: 'destructive',
        })
      }
    }
  }, [errors])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsMounted(true)
    }
  }, [])

  useEffect(() => {
    const init = async () => {
      await initializeEditor()

      setTimeout(() => {
        _titleRef?.current?.focus()
      }, 0)
    }

    if (isMounted) {
      init()

      return () => {
        ref.current?.destroy()
        ref.current = undefined
      }
    }
  }, [isMounted, initializeEditor])

  async function onSubmit(data: FormData) {
    const blocks = await ref.current?.save()

    const payload: PostCreationRequest = {
      title: data.title,
      content: blocks,
    }

    createPost(payload)
  }

  if (!isMounted) {
    return null
  }

  const { ref: titleRef, ...rest } = register('title')

  return (
    <div className='w-full p-4 bg-zinc-50 dark:bg-zinc-500 rounded-lg border border-zinc-200'>
      <form
        id='note-post-form'
        className='w-fit flex justify-center mx-auto'
        onSubmit={handleSubmit(onSubmit)}>
        <div className='prose prose-stone dark:prose-invert dark:text-white'>
          <TextareaAutosize
            ref={(e) => {
              titleRef(e)
              // @ts-ignore
              _titleRef.current = e
            }}
            {...rest}
            placeholder='Title here...'
            className='w-full resize-none appearance-none overflow-hidden bg-transparent text-5xl font-bold focus:outline-none'
          />
          <div id='editor' className='min-h-[500px]' />
          <p className='text-sm text-gray-500 dark:text-[#9ca3af]'>
            Use{' '}
            <kbd className='rounded-md border bg-muted px-1 text-xs uppercase'>
              Tab
            </kbd>{' '}
            to open the command menu.
          </p>
        </div>
      </form>
    </div>
  )
}