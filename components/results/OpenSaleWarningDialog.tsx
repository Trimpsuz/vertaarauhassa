import type { Dispatch, SetStateAction } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface OpenSaleWarningDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  showAlertModal: boolean;
  setShowAlertModal: Dispatch<SetStateAction<boolean>>;
  onConfirm: () => void;
}

export default function OpenSaleWarningDialog({ open, onOpenChange, showAlertModal, setShowAlertModal, onConfirm }: OpenSaleWarningDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-description="Matkan avaaminen kirjaa sinut ulos vr.fi sivustolta">
        <DialogHeader>
          <DialogTitle>Varoitus</DialogTitle>
        </DialogHeader>
        <p>Matkan avaaminen kirjaa sinut ulos vr.fi sivustolta</p>
        <div className="flex items-center gap-2 ">
          <Checkbox className="cursor-pointer" id="never-show" checked={!showAlertModal} onCheckedChange={(val) => setShowAlertModal(!val)} />
          <label htmlFor="never-show" className="text-sm cursor-pointer">
            Älä näytä tätä uudelleen
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Peruuta
          </Button>
          <Button onClick={onConfirm}>Avaa</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
