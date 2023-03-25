import React, { useState, useEffect } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { getSession } from "next-auth/client";
import { useRouter } from "next/router";
import { useTranslations } from "next-intl";
import { useToasts } from "react-toast-notifications";
import { isUndefined, isNull, isPlainObject, omit, pickBy } from "lodash";
import EventSetupHeader from "@/components/common/EventSetupHeader";
import PageHeader from "@/components/common/PageHeader";
import EventCustomizationForm from "@/components/forms/EventCustomizationForm";
import ViewEventLayout from "@/components/layouts/ViewEventLayout";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import Panel from "@/components/ui/Panel";
import { useEventDispatch } from "@/contexts/EventContext";
import actionTypes from "@/contexts/action-types";
import paths from "@/routes/paths";
import getContextProps from "@/utils/getContextProps";
import getTenant from "@/utils/getTenant";
import api from "@/utils/api";

const EventSetupCustomisationDetail = ({ event, session }) => {
  const router = useRouter();
  const eventDispatch = useEventDispatch();
  const t = useTranslations();
  const methods = useForm({
    defaultValues: {
      ...event,
      extra_required_details: event?.extra_required_details?.map((detail) => ({
        label: detail,
        value: detail,
      })),
      letter_of_intent: !event?.letter_of_intent
        ? t("common.forms.defaultValues.letterOfIntent")
        : event?.letter_of_intent,
      visa_letter: !event?.visa_letter ? "" : event?.visa_letter,
    },
  });
  const { addToast } = useToasts();
  const [isSaving, setSaving] = useState(false);

  const handleUpdate = async (params) => {
    setSaving(true);
    /**
     * Uses FormData as this request has some files in it.
     * It may have multi-dimensional array parameters as well in the future.
     */

    const formdata = {
      ...params,
      _method: "PUT",
      extra_required_details: params?.extra_required_details.map(
        (option) => option.value
      ),
    };

    api({
      url: `events/${event?.id}`,
      method: "POST",
      data: formdata,
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        "X-Tenant": getTenant(),
      },
    })
      .then((res) => {
        addToast("Event customisations saved successfully", {
          appearance: "success",
          autoDismiss: true,
        });
        router.replace(router.asPath);
        // router.push({
        //   pathname: paths.ADMIN_EVT_SETUP_GRAPHICS,
        //   query: { eventId: event?.id },
        // });
      })
      .catch((err) => {
        addToast("Failed to save event customisations.", {
          appearance: "error",
          autoDismiss: true,
        });
      })
      .finally(() => setSaving(false));
  };

  const pageHeaderToolbar = (
    <Button
      color="primary"
      isCircle
      onClick={methods.handleSubmit(handleUpdate)}
      isLoading={isSaving}
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
        title="Edit Event Financial Details"
        color="inverse"
        maximizable
        collapsable
      >
        <FormProvider {...methods}>
          <EventCustomizationForm {...{ isSaving }} />
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

  return { notFound: true };
};

EventSetupCustomisationDetail.Layout = ViewEventLayout;

export default EventSetupCustomisationDetail;
