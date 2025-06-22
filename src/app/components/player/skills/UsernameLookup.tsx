import React, { useEffect, useRef, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { useStore } from '@/state';
import localforage from 'localforage';
import { useSide } from '@/sideContext';

const UsernameLookup: React.FC = observer(() => {
  const store = useStore();
  const side = useSide();

  const storageKey = `dps-calc-username-${side}`;
  const shouldRemember = store.prefs.rememberUsername;

  const [username, setUsername] = useState<string>('');
  const [btnDisabled, setBtnDisabled] = useState(false);
  const btn = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (shouldRemember) {
      localforage.getItem<string>(storageKey).then((val) => {
        if (val) setUsername(val);
      }).catch(() => {});
    }
  }, [storageKey, shouldRemember]);

  return (
    <>
      <input
        type="text"
        className="form-control rounded w-full mt-auto"
        placeholder="OSRS username"
        value={username}
        onChange={(e) => {
          const val = e.currentTarget.value;
          setUsername(val);
          if (shouldRemember) {
            localforage.setItem(storageKey, val).catch(() => {});
          }
        }}
        onKeyUp={(e) => {
          if (e.key === 'Enter') {
            btn.current?.click();
          }
        }}
      />
      <button
        ref={btn}
        disabled={!username || btnDisabled}
        type="button"
        className="ml-1 text-sm btn"
        onClick={async () => {
          setBtnDisabled(true);
          await store.fetchCurrentPlayerSkills(username, side);
          setBtnDisabled(false);
        }}
      >
        Lookup
      </button>
    </>
  );
});

export default UsernameLookup;
