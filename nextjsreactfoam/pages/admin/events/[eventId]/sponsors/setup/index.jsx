import { useState, useEffect } from "react";
import { getSession } from "next-auth/client";
import { useTranslations } from "next-intl";
import queryString from "query-string";
import { useForm, FormProvider } from "react-hook-form";
import ContentErrorBoundary from "@/components/common/ContentErrorBoundary";
import EventSponsorSetupHeader from "@/components/common/EventSponsorSetupHeader";
import EventSponsorSetupGeneralDetailForm from "@/components/forms/EventSponsorSetupGeneralDetailForm";
import PageHeader from "@/components/common/PageHeader";
import ViewEventLayout from "@/components/layouts/ViewEventLayout";
import Panel from "@/components/ui/Panel";
import { useEventDispatch } from "@/contexts/EventContext";
import actionTypes from "@/contexts/action-types";
import getContextProps from "@/utils/getContextProps";
import getTenant from "@/utils/getTenant";
import api from "@/utils/api";
import Button from "@/components/ui/Button";
import { useToasts } from "react-toast-notifications";
import { useRouter } from "next/router";

const Setup = ({ event, eventSponsorship, context }) => {
  const t = useTranslations();
  const eventDispatch = useEventDispatch();
  const [isLoading, setIsLoading] = useState(false);

  const methods = useForm({
    defaultValues: {
      sponsorship_admin: eventSponsorship?.sponsorship_admin
        ? {
            value: eventSponsorship?.sponsorship_admin?.id,
            label: `${eventSponsorship?.sponsorship_admin?.first_name} ${eventSponsorship?.sponsorship_admin?.last_name}`,
          }
        : undefined,
      sponsorship_payment_terms:
      eventSponsorship?.sponsorship_payment_terms ?? undefined,
      prospectus_file: eventSponsorship?.prospectus_file ?? undefined,
      manual: eventSponsorship?.manual ?? undefined,
      trade_map_file: eventSponsorship?.trade_map_file ?? undefined,
    },
  });

  const { addToast } = useToasts();
  const router = useRouter();
  const [isSaving, setSaving] = useState(false);

  /**
   * Sets the event to be used for the entire event-related pages.
   * This must be implemented in every event page.
   */
  useEffect(() => {
    eventDispatch({
      type: actionTypes.SET_EVENT,
      payload: event,
    });
  }, [event]);

  const refreshData = () => {
    router.replace(router.asPath);
  };

  const onUpdate = async ({
    sponsorship_admin,
    prospectus_file,
    trade_map_file,
    sponsorship_payment_terms,
    manual,
    ...items
  }) => {
    setSaving(true);
      const formData = new FormData();

    Object.keys(items).map((item) => {
      formData.append(item, items[item]);
    });
    formData.append(`_method`, "PUT");

    formData.append(
      `sponsorship_admin`,
      sponsorship_admin?.id ? sponsorship_admin?.id : sponsorship_admin?.value
    );
    formData.append(`sponsorship_payment_terms`, sponsorship_payment_terms);

    prospectus_file &&
      typeof prospectus_file == "object" &&
      formData.append(`prospectus_file`, prospectus_file);

    trade_map_file &&
      typeof trade_map_file == "object" &&
      formData.append(`trade_map_file`, trade_map_file);

    manual && typeof manual == "object" && formData.append(`manual`, manual);

    const session = await getSession(context);
    const headers = {
      Authorization: `Bearer ${session.accessToken}`,
      "X-Tenant": getTenant(context.req),
    };

    try {
      await api.post(`/events/${event?.id}/sponsorships/settings`, formData, {
        headers,
      });

      addToast("Sponsorship general details successfully saved.", {
        appearance: "success",
        autoDismiss: true,
      });
    } catch (e) {
      addToast("Failed to save sponsorship general details.", {
        appearance: "error",
        autoDismiss: true,
      });
    } finally {
      setSaving(false);
    }







  };

  return (
    <ContentErrorBoundary>
      <PageHeader title="Setup" />
      <EventSponsorSetupHeader />
      <Panel title="General Details" color="inverse" maximizable collapsable>
        <FormProvider {...methods}>
          <form autoComplete="off">
            <EventSponsorSetupGeneralDetailForm  />
            <div
              className="form-row end"
              style={{
                justifyContent: "flex-end",
                padding: 10,
              }}
            >
              <Button
                onClick={methods.handleSubmit(onUpdate)}
                color="primary"

              >
                Save
              </Button>






            </div>
          </form>
        </FormProvider>
      </Panel>
    </ContentErrorBoundary>
  );
};

export async function getServerSideProps(context) {

  const session = await getSession(context);
  const parsedQueryString = queryString.parse(context.req.url.split("?")[1]);
  const urlQueryString = queryString.stringify({
    ...parsedQueryString,
    page: context.query.page || 1,
  });

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

      const eventSponsorshipResponse = await api({
        url: `/events/${context.params.eventId}/sponsorships/settings`,
        headers,
      });

      return {
        props: {
          session,
          context: await getContextProps(context),
          event: eventResponse.data.data,
          eventSponsorship: eventSponsorshipResponse?.data?.data || [],
        },
      };
    } catch (err) {
      return {
        notFound: true,
      };
    }
  }
}

Setup.Layout = ViewEventLayout;

export default Setup;
