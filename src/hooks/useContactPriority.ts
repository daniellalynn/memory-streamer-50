import { useState, useEffect } from 'react';
import { Contact } from '@/components/ContactTagger';
import { useSocialMediaPriority } from './useSocialMediaPriority';

export interface PhotoContact {
  photoId: string;
  contactId: string;
  contact: Contact;
}

export interface ChatActivity {
  contactId: string;
  contact: Contact;
  lastChatTime: number;
}

export interface ContactPriority {
  priority: 1 | 2 | 3 | 4 | 5;
  contact?: Contact;
  platform?: any;
  reason: string;
}

export const useContactPriority = () => {
  const { getSocialPriorities } = useSocialMediaPriority();
  const [photoContacts, setPhotoContacts] = useState<PhotoContact[]>([]);
  const [chatActivities, setChatActivities] = useState<ChatActivity[]>([]);
  const [currentChatContact, setCurrentChatContact] = useState<Contact | null>(null);

  // Load from localStorage on init
  useEffect(() => {
    const savedPhotoContacts = localStorage.getItem('memoryStreamer_photoContacts');
    const savedChatActivities = localStorage.getItem('memoryStreamer_chatActivities');
    const savedCurrentChat = localStorage.getItem('memoryStreamer_currentChat');

    if (savedPhotoContacts) {
      setPhotoContacts(JSON.parse(savedPhotoContacts));
    }
    if (savedChatActivities) {
      setChatActivities(JSON.parse(savedChatActivities));
    }
    if (savedCurrentChat) {
      setCurrentChatContact(JSON.parse(savedCurrentChat));
    }
  }, []);

  // Save to localStorage when data changes
  useEffect(() => {
    localStorage.setItem('memoryStreamer_photoContacts', JSON.stringify(photoContacts));
  }, [photoContacts]);

  useEffect(() => {
    localStorage.setItem('memoryStreamer_chatActivities', JSON.stringify(chatActivities));
  }, [chatActivities]);

  useEffect(() => {
    if (currentChatContact) {
      localStorage.setItem('memoryStreamer_currentChat', JSON.stringify(currentChatContact));
    }
  }, [currentChatContact]);

  const addPhotoContact = (photoId: string, contact: Contact) => {
    const photoContact: PhotoContact = {
      photoId,
      contactId: contact.id,
      contact
    };
    setPhotoContacts(prev => [...prev.filter(pc => pc.photoId !== photoId), photoContact]);
  };

  const updateChatActivity = (contact: Contact) => {
    const chatActivity: ChatActivity = {
      contactId: contact.id,
      contact,
      lastChatTime: Date.now()
    };
    setChatActivities(prev => {
      const filtered = prev.filter(ca => ca.contactId !== contact.id);
      return [chatActivity, ...filtered].slice(0, 10); // Keep only 10 most recent
    });
    setCurrentChatContact(contact);
  };

  const getContactPriorityForPhoto = (photoId: string): ContactPriority[] => {
    const priorities: ContactPriority[] = [];

    // Social media takes priority over personal contacts
    const socialPriorities = getSocialPriorities();
    const convertedSocialPriorities: ContactPriority[] = socialPriorities.map(sp => ({
      priority: sp.priority,
      platform: sp.platform,
      reason: sp.reason
    }));
    priorities.push(...convertedSocialPriorities);

    // Only add personal contacts if no social media is connected
    if (socialPriorities.length === 0) {
      // Priority 1: Person tagged in the photo
      const photoContact = photoContacts.find(pc => pc.photoId === photoId);
      if (photoContact) {
        priorities.push({
          priority: 1,
          contact: photoContact.contact,
          reason: "Tagged in this photo"
        });
      }

      // Priority 2: Current chat person
      if (currentChatContact && (!photoContact || currentChatContact.id !== photoContact.contactId)) {
        priorities.push({
          priority: 2,
          contact: currentChatContact,
          reason: "Currently chatting with"
        });
      }

      // Priority 3: Last chatted person
      const lastChatted = chatActivities[0];
      if (lastChatted && 
          (!currentChatContact || lastChatted.contactId !== currentChatContact.id) &&
          (!photoContact || lastChatted.contactId !== photoContact.contactId)) {
        priorities.push({
          priority: 3,
          contact: lastChatted.contact,
          reason: "Recently chatted with"
        });
      }

      // Priority 4: Public (represented as a special contact)
      priorities.push({
        priority: 4,
        contact: {
          id: 'public',
          name: 'Public/Social Media',
          relationship: 'other'
        },
        reason: "Share publicly"
      });
    }

    // Priority 5: Parents (if any family contacts exist)
    const allContacts = [
      ...photoContacts.map(pc => pc.contact),
      ...chatActivities.map(ca => ca.contact)
    ];
    
    const familyContacts = allContacts
      .filter(contact => contact.relationship === 'family')
      .filter(contact => !priorities.some(p => p.contact.id === contact.id));
    
    if (familyContacts.length > 0) {
      priorities.push({
        priority: 5,
        contact: familyContacts[0], // Take first family contact as "parents"
        reason: "Family member"
      });
    } else {
      // Fallback "parents" contact
      priorities.push({
        priority: 5,
        contact: {
          id: 'parents',
          name: 'Your Parents',
          relationship: 'family'
        },
        reason: "Family (most embarrassing option)"
      });
    }

    return priorities;
  };

  return {
    photoContacts,
    chatActivities,
    currentChatContact,
    addPhotoContact,
    updateChatActivity,
    setCurrentChatContact,
    getContactPriorityForPhoto
  };
};