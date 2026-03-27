'use client';

import { useState } from 'react';
import LikeCommentShare from './LikeCommentShare';
import CommentsSection from './CommentsSection';

interface Props {
  blogId: string;
  blogTitle: string;
}

export default function BlogInteractions({ blogId, blogTitle }: Props) {
  const [commentOpen, setCommentOpen] = useState(false);
  const [commentCount, setCommentCount] = useState(0);

  return (
    <>
      <LikeCommentShare
        blogId={blogId}
        blogTitle={blogTitle}
        commentCount={commentCount}
        onCommentClick={() => setCommentOpen(true)}
      />
      <CommentsSection
        blogId={blogId}
        isOpen={commentOpen}
        onClose={() => setCommentOpen(false)}
        onCountChange={setCommentCount}
      />
    </>
  );
}
