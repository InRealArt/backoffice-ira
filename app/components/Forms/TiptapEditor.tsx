'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import TextAlign from '@tiptap/extension-text-align'
import { useEffect, useCallback } from 'react'

interface TiptapEditorProps {
    value: string
    onChange: (html: string) => void
    placeholder?: string
}

const ToolbarButton = ({
    onClick,
    active,
    title,
    children,
}: {
    onClick: () => void
    active?: boolean
    title: string
    children: React.ReactNode
}) => (
    <button
        type="button"
        onMouseDown={(e) => {
            e.preventDefault()
            onClick()
        }}
        title={title}
        style={{
            padding: '4px 8px',
            border: '1px solid var(--color-border, #d1d5db)',
            borderRadius: '4px',
            background: active ? 'var(--color-primary, #3b82f6)' : 'transparent',
            color: active ? '#fff' : 'inherit',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: active ? 600 : 400,
            lineHeight: 1,
        }}
    >
        {children}
    </button>
)

export default function TiptapEditor({ value, onChange, placeholder }: TiptapEditorProps) {
    const editor = useEditor({
        immediatelyRender: false,
        extensions: [
            StarterKit,
            Underline,
            Link.configure({
                openOnClick: false,
                HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' },
            }),
            TextAlign.configure({ types: ['heading', 'paragraph'] }),
        ],
        content: value || '',
        onUpdate: ({ editor }) => {
            const html = editor.getHTML()
            // Si vide (juste <p></p>), on retourne une chaîne vide
            onChange(html === '<p></p>' ? '' : html)
        },
        editorProps: {
            attributes: {
                style: [
                    'min-height:160px',
                    'outline:none',
                    'padding:12px',
                    'font-size:14px',
                    'line-height:1.6',
                ].join(';'),
            },
        },
    })

    // Synchronise le contenu si la valeur prop change de l'extérieur
    useEffect(() => {
        if (!editor) return
        const currentHtml = editor.getHTML()
        const incoming = value || ''
        if (currentHtml !== incoming && incoming !== '<p></p>') {
            editor.commands.setContent(incoming, { emitUpdate: false })
        }
    }, [editor, value])

    const setLink = useCallback(() => {
        if (!editor) return
        const previousUrl = editor.getAttributes('link').href as string | undefined
        const url = window.prompt('URL du lien', previousUrl ?? 'https://')
        if (url === null) return
        if (url === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run()
            return
        }
        editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
    }, [editor])

    if (!editor) return null

    return (
        <div
            style={{
                border: '1px solid var(--color-border, #d1d5db)',
                borderRadius: '6px',
                overflow: 'hidden',
                background: 'var(--color-surface, #fff)',
            }}
        >
            <style>{`
                .tiptap-editor-content .tiptap ul {
                    list-style-type: disc;
                    padding-left: 1.5em;
                    margin: 0.5em 0;
                }
                .tiptap-editor-content .tiptap ol {
                    list-style-type: decimal;
                    padding-left: 1.5em;
                    margin: 0.5em 0;
                }
                .tiptap-editor-content .tiptap li {
                    margin: 0.2em 0;
                }
                .tiptap-editor-content .tiptap h2 {
                    font-size: 1.25em;
                    font-weight: 700;
                    margin: 0.75em 0 0.25em;
                }
                .tiptap-editor-content .tiptap h3 {
                    font-size: 1.1em;
                    font-weight: 600;
                    margin: 0.6em 0 0.2em;
                }
                .tiptap-editor-content .tiptap blockquote {
                    border-left: 3px solid var(--color-border, #d1d5db);
                    margin: 0.5em 0;
                    padding-left: 1em;
                    color: var(--color-text-muted, #6b7280);
                    font-style: italic;
                }
                .tiptap-editor-content .tiptap a {
                    color: var(--color-primary, #3b82f6);
                    text-decoration: underline;
                }
                .tiptap-editor-content .tiptap p {
                    margin: 0.3em 0;
                }
            `}</style>
            {/* Toolbar */}
            <div
                style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '4px',
                    padding: '8px',
                    borderBottom: '1px solid var(--color-border, #d1d5db)',
                    background: 'var(--color-surface-alt, #f9fafb)',
                }}
            >
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    active={editor.isActive('bold')}
                    title="Gras"
                >
                    <strong>B</strong>
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    active={editor.isActive('italic')}
                    title="Italique"
                >
                    <em>I</em>
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleUnderline().run()}
                    active={editor.isActive('underline')}
                    title="Souligné"
                >
                    <span style={{ textDecoration: 'underline' }}>U</span>
                </ToolbarButton>

                <span style={{ width: '1px', background: 'var(--color-border, #d1d5db)', margin: '0 4px' }} />

                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    active={editor.isActive('heading', { level: 2 })}
                    title="Titre H2"
                >
                    H2
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                    active={editor.isActive('heading', { level: 3 })}
                    title="Titre H3"
                >
                    H3
                </ToolbarButton>

                <span style={{ width: '1px', background: 'var(--color-border, #d1d5db)', margin: '0 4px' }} />

                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    active={editor.isActive('bulletList')}
                    title="Liste à puces"
                >
                    • Liste
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    active={editor.isActive('orderedList')}
                    title="Liste numérotée"
                >
                    1. Liste
                </ToolbarButton>

                <span style={{ width: '1px', background: 'var(--color-border, #d1d5db)', margin: '0 4px' }} />

                <ToolbarButton
                    onClick={() => editor.chain().focus().setTextAlign('left').run()}
                    active={editor.isActive({ textAlign: 'left' })}
                    title="Aligner à gauche"
                >
                    ←
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().setTextAlign('center').run()}
                    active={editor.isActive({ textAlign: 'center' })}
                    title="Centrer"
                >
                    ↔
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().setTextAlign('right').run()}
                    active={editor.isActive({ textAlign: 'right' })}
                    title="Aligner à droite"
                >
                    →
                </ToolbarButton>

                <span style={{ width: '1px', background: 'var(--color-border, #d1d5db)', margin: '0 4px' }} />

                <ToolbarButton onClick={setLink} active={editor.isActive('link')} title="Lien">
                    🔗
                </ToolbarButton>
                {editor.isActive('link') && (
                    <ToolbarButton
                        onClick={() => editor.chain().focus().unsetLink().run()}
                        title="Supprimer le lien"
                    >
                        🔗✕
                    </ToolbarButton>
                )}

                <span style={{ width: '1px', background: 'var(--color-border, #d1d5db)', margin: '0 4px' }} />

                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleBlockquote().run()}
                    active={editor.isActive('blockquote')}
                    title="Citation"
                >
                    « »
                </ToolbarButton>
            </div>

            {/* Editor area */}
            <div className="tiptap-editor-content">
                <EditorContent editor={editor} />
            </div>

            {/* Placeholder if empty */}
            {editor.isEmpty && placeholder && (
                <div
                    style={{
                        position: 'absolute',
                        pointerEvents: 'none',
                        color: 'var(--color-text-muted, #9ca3af)',
                        padding: '12px',
                        fontSize: '14px',
                    }}
                >
                    {placeholder}
                </div>
            )}
        </div>
    )
}
