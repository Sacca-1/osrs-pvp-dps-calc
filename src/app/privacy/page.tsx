import React from 'react';

const PrivacyPage = () => (
  <div className="max-w-3xl mx-auto px-4 py-8 text-sm text-body-300 dark:text-gray-300">
    <div className="bg-tile dark:bg-dark-300 shadow-lg md:rounded border border-body-500 dark:border-dark-200">
      <div className="px-4 py-3.5 border-b-body-400 bg-body-100 dark:bg-dark-400 dark:border-b-dark-200 border-b md:rounded md:rounded-bl-none md:rounded-br-none">
        <h1 className="font-serif text-xl tracking-tight font-bold dark:text-white">Privacy Policy</h1>
      </div>
      <div className="p-4 space-y-4">
        <p>
          This PvP DPS calculator is a community fork of the OSRS Wiki DPS calculator. It is designed to run calculator
          logic in your browser and does not require an account.
        </p>

        <section>
          <h2 className="font-serif text-lg font-bold dark:text-white">Information Stored Locally</h2>
          <p className="mt-1">
            The app may store your calculator preferences, loadouts, and optional remembered username in your browser
            storage so they persist between visits. This data stays on your device unless you use a feature that sends
            it elsewhere, such as sharing a loadout link.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-lg font-bold dark:text-white">Username Lookup</h2>
          <p className="mt-1">
            If you use the username lookup feature, the entered RuneScape name may be sent to external services used to
            fetch public hiscore data. Do not enter a username if you do not want that lookup request to be made.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-lg font-bold dark:text-white">Analytics and Hosting</h2>
          <p className="mt-1">
            The deployed site may use hosting, logs, and Vercel Analytics to understand basic usage and diagnose errors.
            These services may process technical information such as page views, browser details, approximate location,
            referrers, and request metadata.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-lg font-bold dark:text-white">Contact</h2>
          <p className="mt-1">
            For privacy questions or feedback, message
            {' '}
            <a href="https://discord.com/users/687630346845683752" target="_blank" rel="noreferrer">sacca_1 on Discord</a>
            .
          </p>
        </section>

        <p className="text-xs text-gray-400">Last updated: 29 May 2026</p>
      </div>
    </div>
  </div>
);

export default PrivacyPage;
