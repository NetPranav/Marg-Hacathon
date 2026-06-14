"use client";

import { useState } from "react";
import PrimaryLoadCard from "@/components/cards/PrimaryLoadCard";
import SecondaryLoadCard from "@/components/cards/SecondaryLoadCard";
import BidActionSheet from "@/components/modals/BidActionSheet";

export default function MarketFeed() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);

  return (
    <>
      <div className="flex flex-col">
        <PrimaryLoadCard 
          onCustomBid={handleOpenModal} 
          onAccept={handleOpenModal} 
        />
        <SecondaryLoadCard />
        <SecondaryLoadCard />
      </div>

      <BidActionSheet 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
      />
    </>
  );
}
