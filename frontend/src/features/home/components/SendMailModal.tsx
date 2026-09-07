import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Form, Modal, toast, useOverlayState } from '@heroui/react';
import { TextInputField } from '../../../components/form/TextInputField';
import { TextAreaField } from '../../../components/form/TextAreaField';
import { FormErrorSummary } from '../../../components/form/FormErrorSummary';
import { useApplyServerErrors } from '../../../components/form/useApplyServerErrors';
import { showActionError } from '../../../lib/api-client';
import { useSendMail } from '../hooks/useSendMail';
import { mailSchema, type MailFormValues } from '../types/mail';

export function SendMailModal() {
  const modal = useOverlayState();
  const sendMail = useSendMail();

  const { control, handleSubmit, setError, reset } = useForm<MailFormValues>({
    resolver: zodResolver(mailSchema),
    mode: 'onBlur',
    defaultValues: { to: '', subject: '', message: '' },
  });
  useApplyServerErrors(setError, sendMail.error);

  function onSubmit(values: MailFormValues) {
    sendMail.mutate(values, {
      onSuccess: () => {
        toast.success('Email sent');
        modal.close();
        reset();
      },
      onError: (err) => showActionError(err, 'Could not send email'),
    });
  }

  return (
    <>
      <Button onPress={modal.open}>Send Email</Button>

      <Modal.Backdrop isOpen={modal.isOpen} onOpenChange={modal.setOpen}>
        <Modal.Container size="lg">
          <Modal.Dialog>
            <Modal.Header>
              <Modal.Heading>Send Email</Modal.Heading>
            </Modal.Header>
            <Modal.Body>
              <Form validationBehavior="aria" className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
                <FormErrorSummary error={sendMail.error} />
                <TextInputField control={control} name="to" label="Recipient" isRequired />
                <TextInputField control={control} name="subject" label="Subject" isRequired />
                <TextAreaField control={control} name="message" label="Message" />
                <div className="mt-2 flex justify-end gap-2">
                  <Button type="button" variant="ghost" onPress={modal.close} isDisabled={sendMail.isPending}>
                    Cancel
                  </Button>
                  <Button type="submit" isDisabled={sendMail.isPending}>
                    {sendMail.isPending ? 'Sending…' : 'Send'}
                  </Button>
                </div>
              </Form>
            </Modal.Body>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </>
  );
}
