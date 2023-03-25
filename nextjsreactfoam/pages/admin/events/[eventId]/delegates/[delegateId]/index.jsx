import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { getSession } from "next-auth/client";
import { useForm, FormProvider } from "react-hook-form";
import { useTranslations } from "next-intl";
import { useToasts } from "react-toast-notifications";
import Link from "next/link";
import classNames from "classnames";
import ContentErrorBoundary from "@/components/common/ContentErrorBoundary";
import PageHeader from "@/components/common/PageHeader";
import UserRegistrationAccommodationWidget from "@/components/common/UserRegistrationAccommodationWidget";
import UserRegistrationAddonsWidget from "@/components/common/UserRegistrationAddonsWidget";
import UserRegistrationQuestionAnswersWidget from "@/components/common/UserRegistrationQuestionAnswersWidget";
import UserRegistrationMembershipWidget from "@/components/common/UserRegistrationMembershipsWidget";
import UserRegistrationDetailsWidget from "@/components/common/UserRegistrationDetailsWidget";
import UserViewProfile from "@/components/common/UserViewProfile";
import UserRegistrationMiscForm from "@/components/forms/UserRegistrationMiscForm";
import UserRegistrationPaymentSettingsForm from "@/components/forms/UserRegistrationPaymentSettingsForm";
import ViewDelegateLayout from "@/components/layouts/ViewDelegateLayout";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import Label from "@/components/ui/Label";
import Panel from "@/components/ui/Panel";
import { useEventDispatch } from "@/contexts/EventContext";
import actionTypes from "@/contexts/action-types";
import paths from "@/routes/paths";
import api from "@/utils/api";
import getContextProps from "@/utils/getContextProps";
import getTenant from "@/utils/getTenant";
import localizeDate from "@/utils/localizeDate";

const UserDashboard = ({ event, registration, session }) => {
  const router = useRouter();
  const { addToast } = useToasts();
  const t = useTranslations();
  const eventDispatch = useEventDispatch();
  const methods = useForm({
    defaultValues: { ...registration, risky_user: registration?.user?.risky },
  });

  const handleRegistrationUpdate = async (params) => {
    let requestParams = {
      ...params,
      _method: "PUT",
    };

    try {
      const response = await api({
        url: `events/${event?.id}/registrations/${registration?.id}`,
        method: "POST",
        data: requestParams,
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          "X-Tenant": getTenant(),
        },
      });

      router.push(router);
    } catch (e) {}
  };

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
      <PageHeader title="View" />
      <UserViewProfile user={registration?.user}>
        <hr className="m-t-0  bg-black-transparent-1" />
        <h4 className="mb-4">Registration Details</h4>
        <div className="row">
          <div className="col-md-4">
            <UserRegistrationDetailsWidget {...{ registration }} />
            <UserRegistrationMembershipWidget {...{ registration }} />
          </div>
          <div className="col-md-4">
            <UserRegistrationAccommodationWidget {...{ registration }} />
            <UserRegistrationQuestionAnswersWidget {...{ registration }} />
          </div>
          <div className="col-md-4">
            <UserRegistrationAddonsWidget {...{ registration }} />
          </div>
        </div>
        <hr className="m-t-0  bg-black-transparent-1" />
        <Panel
          title="Edit Registration"
          color="inverse"
          maximizable
          collapsable
          toolbar={
            <Button
              size="xs"
              color="success"
              onClick={methods.handleSubmit(handleRegistrationUpdate)}
            >
              Save Changes
            </Button>
          }
        >
          <FormProvider {...methods}>
            <UserRegistrationMiscForm />
            <UserRegistrationPaymentSettingsForm />
          </FormProvider>
        </Panel>
      </UserViewProfile>
    </ContentErrorBoundary>
  );
};

export async function getServerSideProps(context) {
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
}
UserDashboard.Layout = ViewDelegateLayout;

export default UserDashboard;
