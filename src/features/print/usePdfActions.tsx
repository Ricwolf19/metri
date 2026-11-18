import { BlockingOverlay, useDialog, useToast } from '@/components/ui';
import { useT } from '@/i18n';
import { shareFailed, shareFile } from '@/lib/share-file';
import { captureError } from '@/lib/telemetry';
import { useBlockingTask } from '@/lib/useBlockingTask';

import { pdfFileName, printDocument, writePdf } from './pdf';

/** A built document: its HTML and the title its file and share sheet carry. */
export type PdfDoc = { html: string; title: string };

/**
 * "Share PDF" or "Print" for one document, from a dialog. Building the HTML
 * (synchronous reads) and writing the file run behind the blocking overlay;
 * the share sheet and the print dialog then stand on their own, like the data
 * export's. Render `overlay` once in the host.
 */
export const usePdfActions = () => {
  const t = useT();
  const toast = useToast();
  const dialog = useDialog();
  const blocking = useBlockingTask<'pdf'>();

  const run = (build: () => PdfDoc | null, mode: 'share' | 'print') =>
    blocking.start('pdf', async () => {
      let doc: PdfDoc | null;
      try {
        doc = build();
      } catch (e) {
        captureError(e);
        doc = null;
      }
      if (!doc) {
        toast.error(t('print.failed'));
        return;
      }
      if (mode === 'print') {
        void printDocument(doc.html).then((outcome) => {
          if (outcome === 'failed') toast.error(t('print.failed'));
        });
        return;
      }
      let uri: string;
      try {
        uri = await writePdf(doc.html, pdfFileName(doc.title));
      } catch (e) {
        captureError(e);
        toast.error(t('print.failed'));
        return;
      }
      void shareFile(uri, 'pdf', doc.title).then((outcome) => {
        if (shareFailed(outcome)) toast.error(t('share.failed'));
      });
    });

  const open = (title: string, build: () => PdfDoc | null) =>
    dialog.show({
      title,
      message: t('print.chooseBody'),
      actions: [
        { label: t('print.sharePdf'), style: 'confirm', onPress: () => run(build, 'share') },
        { label: t('print.print'), onPress: () => run(build, 'print') },
        { label: t('common.cancel'), style: 'cancel' },
      ],
    });

  const overlay = (
    <BlockingOverlay
      visible={blocking.busy !== null}
      onShow={blocking.onShow}
      label={t('print.preparing')}
    />
  );

  return { open, overlay };
};
