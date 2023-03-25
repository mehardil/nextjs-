import React, { useEffect } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { getSession } from "next-auth/client";
import { useTranslations } from "next-intl";
import { useRouter } from "next/router";
import EventSetupHeader from "@/components/common/EventSetupHeader";
import PageHeader from "@/components/common/PageHeader";
import EventSocialMediaForm from "@/components/forms/EventSocialMediaForm";
import ViewEventLayout from "@/components/layouts/ViewEventLayout";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import Panel from "@/components/ui/Panel";
import { useEventDispatch } from "@/contexts/EventContext";
import actionTypes from "@/contexts/action-types";
import getContextProps from "@/utils/getContextProps";
import getTenant from "@/utils/getTenant";
import api from "@/utils/api";
import { useToasts } from "react-toast-notifications";
import paths from "@/routes/paths";

const EventSocialDetail = ({ event, session }) => {
  const router = useRouter();
  const eventDispatch = useEventDispatch();
  const methods = useForm({
    defaultValues: {
      ...event,
      fb_link: event?.fb_link
        ? event?.fb_link.replace(/^http:\/\//, "")
        : undefined,
      twitter_link: event?.twitter_link
        ? event?.twitter_link.replace(/^http:\/\//, "")
        : undefined,
      instagram_link: event?.instagram_link
        ? event?.instagram_link.replace(/^http:\/\//, "")
        : undefined,
      linkedin_link: event?.linkedin_link
        ? event?.linkedin_link.replace(/^http:\/\//, "")
        : undefined,
    },
  });
  const t = useTranslations();
  const { addToast } = useToasts();

  const handleUpdate = async (params) => {
    let requestParams = params;

    requestParams = {
      ...requestParams,
      _method: "PUT",
    };

    api({
      url: `events/${event?.id}`,
      method: "POST",
      data: requestParams,
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        "X-Tenant": getTenant(),
      },
    })
      .then((res) => {
        addToast("Event socials saved successfully", {
          appearance: "success",
          autoDismiss: true,
        });
        router.push(router);
      })
      .catch((err) => {
        addToast("Failed to save event socials.", {
          appearance: "error",
          autoDismiss: true,
        });
      });
  };

  const pageHeaderToolbar = (
    <Button
      color="primary"
      isCircle
      onClick={methods.handleSubmit(handleUpdate)}
    >
      <Icon icon="save" type="far" className="mr-1" />
      {t("common.forms.saveChanges")}
    </Button>
  );

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

  return (
    <>
      <PageHeader
        title="Edit Event"
        toolbar={pageHeaderToolbar}
        description={<EventSetupHeader />}
      />

      <Panel
        title="Edit Event Graphic Details"
        color="inverse"
        maximizable
        collapsable
      >
        <FormProvider {...methods}>
          <EventSocialMediaForm />
        </FormProvider>
      </Panel>
    </>
  );
};

export const getServerSideProps = async (context) => {
  const session = await getSession(context);

  if (session) {
    try {
      const response = await api({
        url: `/events/${context.params.eventId}`,
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          "X-Tenant": getTenant(context.req),
        },
      });

      return {
        props: {
          session,
          context: await getContextProps(context),
          event: response.data.data,
        },
      };
    } catch (err) {
      return {
        notFound: true,
      };
    }
  }
};

EventSocialDetail.Layout = ViewEventLayout;

export default EventSocialDetail;
