import React from 'react';
import { Collection, CollectionColorVariant } from '../types';
import { getCollectionIcon } from '../lib/collectionIcons';

// The collection's chosen colour, softened to sit on parchment.
const TINTS: Record<CollectionColorVariant, string> = {
  green: 'bg-[#E3E9CF] text-[#3E5A39]',
  rose: 'bg-[#F2DFD6] text-[#8A4B44]',
  purple: 'bg-[#E6E1EE] text-[#5B5085]',
  amber: 'bg-[#F3E6C4] text-[#86641E]',
};

interface CollectionIconProps {
  collection: Pick<Collection, 'iconType' | 'colorVariant'>;
  className?: string;
  iconClassName?: string;
}

/** A collection's line icon in a soft circle tinted with its colour. */
export const CollectionIcon: React.FC<CollectionIconProps> = ({
  collection,
  className = 'w-11 h-11',
  iconClassName = 'w-5 h-5',
}) => {
  const Icon = getCollectionIcon(collection.iconType);
  return (
    <span
      className={`rounded-full flex items-center justify-center shrink-0 ${TINTS[collection.colorVariant || 'green']} ${className}`}
      aria-hidden="true"
    >
      <Icon className={iconClassName} strokeWidth={1.75} />
    </span>
  );
};
