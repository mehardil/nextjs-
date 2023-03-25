import React, { useEffect } from "react";
import { useRouter } from "next/router";
import { getSession } from "next-auth/client";
import { useForm, FormProvider } from "react-hook-form";
import { useToasts } from "react-toast-notifications";
import PageHeader from "@/components/common/PageHeader";
import DelegateRegoTable from "@/components/common/DelegateRegoTable";
import ContentErrorBoundary from "@/components/common/ContentErrorBoundary";
import UserRegistrationAddonsForm from "@/components/forms/UserRegistrationAddonsForm";
import ViewDelegateLayout from "@/components/layouts/ViewDelegateLayout";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import Panel from "@/components/ui/Panel";
import { useEventDispatch } from "@/contexts/EventContext";
import actionTypes from "@/contexts/action-types";
import api from "@/utils/api";
import getContextProps from "@/utils/getContextProps";
import getTenant from "@/utils/getTenant";

const DelegateAddons = ({ event, registration, session }) => {
  const router = useRouter();
  const methods = useForm({ defaultValues: { addons: [] } });
  const eventDispatch = useEventDispatch();

  const handleItemUpdate = async (params) => {
    try {
      const response = await api({
        url: `events/${event?.id}/addon-costs/batch/add`,
        method: "POST",
        data: { ...params, user: registration?.user?.id },
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          "X-Tenant": getTenant(),
        },
      });

      router.push(router);
    } catch (e) {}
  };

  const pageHeaderToolbar = (
    <Button
      color="primary"
      isCircle
      onClick={methods.handleSubmit(handleItemUpdate)}
    >
      Avail Selected Addons
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
        <PageHeader title="Addons" toolbar={pageHeaderToolbar} />
        <Panel title="Available Addons" color="inverse">
          <FormProvider {...methods}>
            <UserRegistrationAddonsForm />
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

DelegateAddons.Layout = ViewDelegateLayout;

export default DelegateAddons;
