import React, { createRef, useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { useStore } from '@/state';
import Modal from '@/app/components/generic/Modal';
import { generateShortlink } from '@/utils';
import { toast } from 'react-toastify';
import { IconClipboardCopy, IconExternalLink } from '@tabler/icons-react';

const ShareModal: React.FC = observer(() => {
  const store = useStore();
  const { ui, debug } = store;
  const inputRef = createRef<HTMLInputElement>();

  // Destination site where shared loadouts open. Allows env override but defaults to live Vercel deployment.
  const defaultDomain = 'https://pvp-dps-calc.vercel.app/osrs-dps';
  const envDomain = process.env.NEXT_PUBLIC_SHORTLINK_URL;
  // If env var points to legacy wiki domain, ignore it in favour of new one.
  const domain = envDomain && envDomain.includes('dps.osrs.wiki') ? defaultDomain : (envDomain || defaultDomain);
  const [shareId, setShareId] = useState('');
  const [error, setError] = useState(false);

  useEffect(() => {
    async function generate() {
      setShareId('');
      setError(false);
      try {
        setShareId(await generateShortlink(store.asImportableData));
      } catch (e) {
        setError(true);
      }
    }

    if (ui.showShareModal) {
      generate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ui.showShareModal]);

  return (
    <Modal
      isOpen={ui.showShareModal}
      setIsOpen={(b) => store.updateUIState({ showShareModal: b })}
      title="Share"
    >
      <div className="text-sm">
        <p>You can share your current calculator state (loadouts and selected monster) with friends by sending them the link below.</p>
        <div className="mt-2 flex gap-1">
          <input ref={inputRef} readOnly className="form-control w-full" value={shareId ? `${domain}?id=${shareId}` : 'Generating...'} />
          <button
            className="form-control flex items-center gap-1 hover:scale-105"
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(inputRef.current?.value as string).then(() => {
                toast('Copied share link to clipboard!', { toastId: 'share' });
              }).catch(() => {});
            }}
          >
            <IconClipboardCopy className="w-5" />
            Copy
          </button>
          {debug && (
            <a
              className="form-control flex items-center gap-1 hover:scale-105 no-underline"
              type="button"
              href={`${domain}?id=${shareId}`}
              target="_blank"
            >
              <IconExternalLink className="w-5" />
              Prod
            </a>
          )}
        </div>
        {error && (
          <p className="mt-2 text-red-400 dark:text-red-200">
            There was a problem generating a share link. Please try again.
          </p>
        )}
      </div>
    </Modal>
  );
});

export default ShareModal;
