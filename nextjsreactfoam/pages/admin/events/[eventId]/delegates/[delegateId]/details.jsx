import React, { useEffect, useState } from "react";
import { getSession } from "next-auth/client";
import { useForm, FormProvider } from "react-hook-form";
import { useRouter } from "next/router";
import { useTranslations } from "next-intl";
import PageHeader from "@/components/common/PageHeader";
import ContentErrorBoundary from "@/components/common/ContentErrorBoundary";
import ProfileForm from "@/components/forms/ProfileForm";
import ViewDelegateLayout from "@/components/layouts/ViewDelegateLayout";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import Panel from "@/components/ui/Panel";
import { useEventDispatch } from "@/contexts/EventContext";
import actionTypes from "@/contexts/action-types";
import api from "@/utils/api";
import getContextProps from "@/utils/getContextProps";
import getTenant from "@/utils/getTenant";
import { useToasts } from "react-toast-notifications";
import requestParamBuilder from "@/utils/requestParamBuilder";

const DelegateDetails = ({ registration, session }) => {
  const router = useRouter();
  const t = useTranslations();

  const methods = useForm({
    defaultValues: {
      ...registration?.user,
      extra_emails: registration?.user?.extra_emails.map((emails) => {
        return { label: emails.email, value: emails.email };
      }),
    },
  });
  const eventDispatch = useEventDispatch();
  const { addToast } = useToasts();
  const [isSaving, setIsSaving] = useState(false);

  const handleProfileUpdate = async (params) => {
    let paramsArr = requestParamBuilder(params);
    const requestParams = {
      ...paramsArr,
      gender: paramsArr?.gender,
      extra_emails: paramsArr.extra_emails.map((emails) => emails.value),
      _method: "PUT",
    };

    try {
      setIsSaving(true);

      const response = await api({
        url: `users/${registration?.user?.id}`,
        method: "POST",
        data: requestParams,
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          "X-Tenant": getTenant(),
        },
      });

      addToast("Details successfully saved.", {
        appearance: "success",
        autoDismiss: true,
      });

      router.push(router);
    } catch (e) {
      addToast("Failed to save details.", {
        appearance: "error",
        autoDismiss: true,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const pageHeaderToolbar = (
    <div className="row justify-content-end mb-2">
      <Button
        className=""
        color="primary"
        isCircle
        onClick={methods.handleSubmit(handleProfileUpdate)}
        isLoading={isSaving}
      >
        <Icon icon="save" type="far" className="mr-1" />
        {t("common.forms.saveChanges")}
      </Button>
    </div>
  );

  /**
   * Sets the delegate to be used for the entire delegate-related pages.
   * This must be implemented in every delegate page.
   */
  useEffect(() => {
    eventDispatch({
      type: actionTypes.SET_REGISTRATION,
      payload: registration,
    });
  }, [registration]);

  return (
    <ContentErrorBoundary>
      <PageHeader title="Edit Profile" toolbar={pageHeaderToolbar} />
      <Panel title="Edit Profile" color="inverse">
        <FormProvider {...methods}>
          <ProfileForm />
        </FormProvider>
      </Panel>
    </ContentErrorBoundary>
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
        url: `/events/${context.params.eventId}/registrations/${context.params.delegateId}`,
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

  return {
    props: {},
  };
};

DelegateDetails.authorized = true;
DelegateDetails.Layout = ViewDelegateLayout;

export default DelegateDetails;
