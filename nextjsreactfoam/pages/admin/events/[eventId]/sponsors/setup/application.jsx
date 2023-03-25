import { useState, useEffect } from "react";
import { getSession } from "next-auth/client";
import { useTranslations } from "next-intl";
import queryString from "query-string";
import ContentErrorBoundary from "@/components/common/ContentErrorBoundary";
import EventSponsorSetupHeader from "@/components/common/EventSponsorSetupHeader";
import EventSponsorSetupAppicationForm from "@/components/forms/EventSponsorSetupAppicationForm";
import PageHeader from "@/components/common/PageHeader";
import ViewEventLayout from "@/components/layouts/ViewEventLayout";
import Panel from "@/components/ui/Panel";
import { useEventDispatch } from "@/contexts/EventContext";
import { useForm, FormProvider } from "react-hook-form";
import actionTypes from "@/contexts/action-types";
import getContextProps from "@/utils/getContextProps";
import getTenant from "@/utils/getTenant";
import api from "@/utils/api";
import Button from "@/components/ui/Button";
import { useToasts } from "react-toast-notifications";
import { useRouter } from "next/router";

const Application = ({ event, sponsorship, context }) => {
  const t = useTranslations();
  const eventDispatch = useEventDispatch();
  const { addToast } = useToasts();
  const router = useRouter();
  const [isSaving, setSaving] = useState(false);
  const methods = useForm({
    defaultValues: { ...sponsorship },
  });

  useEffect(() => {
    eventDispatch({
      type: actionTypes.SET_EVENT,
      payload: event,
    });
  }, [event]);

  const refreshData = () => {
    router.replace(router.asPath);
  };

  const onUpdate = async ({ company_logo, ...items }) => {
    setSaving(true);

    const formData = new FormData();
    Object.keys(items).map((item) => {
      formData.append(item, items[item]);
    });

    company_logo &&
      typeof company_logo == "object" &&
      formData.append(`company_logo`, company_logo);

    const session = await getSession(context);
    const headers = {
      Authorization: `Bearer ${session.accessToken}`,
      "X-Tenant": getTenant(context.req),
    };

    try {
      const data = await api.post(
        `/events/${event?.id}/sponsorships/application`,
        formData,
        { headers }
      );

      addToast("Sponsorship application successfully updated", {
        appearance: "success",
        autoDismiss: true,
      });

      refreshData();
    } catch (e) {
      addToast("Failed to updated sponsorship application.", {
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

      <Panel title="Application" color="inverse" maximizable collapsable>
        <FormProvider {...methods}>
          <form autoComplete="off">
            <div className="col-md-10">
              <EventSponsorSetupAppicationForm />
            </div>
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
                isLoading={isSaving}
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

      const sponsorshipApplicationResponse = await api({
        url: `/events/${context.params.eventId}/sponsorships/application`,
        headers,
      });

      return {
        props: {
          session,
          context: await getContextProps(context),
          event: eventResponse.data.data,
          sponsorship: sponsorshipApplicationResponse?.data?.data || [],
          //meta: delegatesResponse.data.meta,
        },
      };
    } catch (err) {
      return {
        notFound: true,
      };
    }
  }
}

Application.Layout = ViewEventLayout;

export default Application;
