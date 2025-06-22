import React from 'react';

/**
 * Simple context that lets deeply–nested components know whether they are
 * rendered inside the attacker or defender panel without having to plumb the
 * `side` prop through every intermediate component.
 */
export const SideContext = React.createContext<'attacker' | 'defender'>('attacker');

export const useSide = () => React.useContext(SideContext);

export default SideContext; 