'use client';
import { ErrorState } from '@/components/common/states';
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <ErrorState
      message="This page could not be displayed. Please try again."
      retry={reset}
    />
  );
}
