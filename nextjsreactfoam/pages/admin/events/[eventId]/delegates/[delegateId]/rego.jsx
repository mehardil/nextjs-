import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { getSession } from "next-auth/client";
import { useForm, FormProvider } from "react-hook-form";
import PageHeader from "@/components/common/PageHeader";
import ContentErrorBoundary from "@/components/common/ContentErrorBoundary";
import UserRegistrationItemCostsForm from "@/components/forms/UserRegistrationItemCostsForm";
import ViewDelegateLayout from "@/components/layouts/ViewDelegateLayout";
import Button from "@/components/ui/Button";
import Panel from "@/components/ui/Panel";
import { useEventDispatch } from "@/contexts/EventContext";
import actionTypes from "@/contexts/action-types";
import api from "@/utils/api";
import getContextProps from "@/utils/getContextProps";
import getTenant from "@/utils/getTenant";
import { useToasts } from "react-toast-notifications";

const DelegateRego = ({ event, registration, session }) => {
  const router = useRouter();
  const methods = useForm({ defaultValues: { item: registration?.item?.id } });
  const eventDispatch = useEventDispatch();
  const { addToast } = useToasts();
  const [isSaving, setIsSaving] = useState(false);

  const handleItemUpdate = async (params) => {
    let requestParams = {
      ...params,
      _method: "PUT",
    };

    try {
      setIsSaving(true);

      const response = await api({
        url: `events/${event?.id}/registrations/${registration?.id}`,
        method: "POST",
        data: requestParams,
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          "X-Tenant": getTenant(),
        },
      });

      addToast("Registration Item successfully updated.", {
        appearance: "success",
        autoDismiss: true,
      });

      router.push(router);
    } catch (e) {
      addToast("Failed to updated Registration Item.", {
        appearance: "error",
        autoDismiss: true,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const pageHeaderToolbar = (
    <Button
      color="primary"
      isCircle
      onClick={methods.handleSubmit(handleItemUpdate)}
      isLoading={isSaving}
    >
      Update Registration Item
    </Button>
  );

  /**
   * Sets the delegate to be used for the entire delegate-related pages.
   * This must be implemented in every delegate page.
   */
  useEffect(() => {
    eventDispatch({
      type: actionTypes.SET_EVENT,
      payload: event,
    });

    eventDispatch({
      type: actionTypes.SET_REGISTRATION,
      payload: registration,
    });
  }, [registration]);

  return (
    <>
      <ContentErrorBoundary>
        <PageHeader title="Registration Options" toolbar={pageHeaderToolbar} />
        <Panel title="Registration Item Costs" color="inverse">
          <FormProvider {...methods}>
            <UserRegistrationItemCostsForm />
          </FormProvider>
        </Panel>
      </ContentErrorBoundary>
    </>
  );
};

export const getServerSideProps = async (context) => {
  const session = await getSession(context);

  const headers = {
    Authorization: `Bearer ${session.accessToken}`,
    "X-Tenant": getTenant(context.req),
  };

  if (session) {
    try {
      const eventResponse = await api({
        url: `/events/${context.params.eventId}?withBasicStats=1`,
        headers,
      });

      const registrationResponse = await api({
        url: `/events/${context.params.eventId}/registrations/${context.params.delegateId}?withEventData=1&withEventAddonPagesData=1`,
        headers,
      });

      return {
        props: {
          session,
          context: await getContextProps(context),
          event: eventResponse.data.data,
          registration: registrationResponse.data.data,
        },
      };
    } catch (err) {
      return {
        notFound: true,
      };
    }
  }
};

DelegateRego.Layout = ViewDelegateLayout;

export default DelegateRego;
