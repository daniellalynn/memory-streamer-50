import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users, Heart, MessageCircle } from "lucide-react";
export interface Contact {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  relationship: 'friend' | 'family' | 'partner' | 'other';
}
interface ContactTaggerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  photoUrl: string;
  photoTitle: string;
  onTagComplete: (contact: Contact) => void;
}
export const ContactTagger = ({
  open,
  onOpenChange,
  photoUrl,
  photoTitle,
  onTagComplete
}: ContactTaggerProps) => {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [relationship, setRelationship] = useState<Contact['relationship']>('friend');
  const handleSubmit = () => {
    if (!name.trim()) return;
    const contact: Contact = {
      id: `contact-${Date.now()}`,
      name: name.trim(),
      phone: phone.trim() || undefined,
      email: email.trim() || undefined,
      relationship
    };
    onTagComplete(contact);
    setName("");
    setPhone("");
    setEmail("");
    setRelationship('friend');
    onOpenChange(false);
  };
  const relationshipIcons = {
    friend: Users,
    family: Heart,
    partner: Heart,
    other: MessageCircle
  };
  const RelationshipIcon = relationshipIcons[relationship];
  return <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Who's in this photo?
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="relative">
            <img src={photoUrl} alt={photoTitle} className="w-full h-32 object-cover rounded-lg" />
            <div className="absolute inset-0 bg-black/20 rounded-lg" />
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="Who is this special person?" className="mt-1" />
            </div>

            <div>
              <Label htmlFor="phone">Phone (optional)</Label>
              <Input id="phone" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+1 (555) 123-4567" className="mt-1" />
            </div>

            <div>
              <Label htmlFor="email">Email (optional)</Label>
              <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="their@email.com" className="mt-1" />
            </div>

            <div>
              <Label>Relationship</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {(['friend', 'family', 'partner', 'other'] as const).map(rel => {
                const Icon = relationshipIcons[rel];
                return <Button key={rel} variant={relationship === rel ? "default" : "outline"} onClick={() => setRelationship(rel)} className="flex items-center gap-2 capitalize">
                      <Icon className="w-4 h-4" />
                      {rel}
                    </Button>;
              })}
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            
            <Button onClick={handleSubmit} disabled={!name.trim()} className="flex-1">
              Tag Person
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>;
};