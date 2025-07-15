import type { EntryContext } from '@shopify/remix-oxygen';
import { RemixServer } from '@remix-run/react';
import { renderToReadableStream } from 'react-dom/server';

export default function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext
) {
  return renderToReadableStream(
    <RemixServer context={remixContext} url={request.url} />,
    {
      bootstrapScripts: ['/entry.client.js'],
      signal: request.signal,
    }
  );
}
