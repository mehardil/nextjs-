import React, { useEffect } from "react";
import { getSession } from "next-auth/client";
import { useForm, FormProvider } from "react-hook-form";
import { useRouter } from "next/router";
import { useTranslations } from "next-intl";
import PageHeader from "@/components/common/PageHeader";
import ContentErrorBoundary from "@/components/common/ContentErrorBoundary";
import ProfileForm from "@/components/forms/ProfileForm";
import ViewOrganisationMembershipLayout from "@/components/layouts/ViewOrganisationMembershipLayout";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import Panel from "@/components/ui/Panel";
import { useOrganisationDispatch } from "@/contexts/OrganisationContext";
import actionTypes from "@/contexts/action-types";
import api from "@/utils/api";
import getContextProps from "@/utils/getContextProps";
import getTenant from "@/utils/getTenant";

const MembershipDetails = ({ membership }) => {
  const t = useTranslations();
  const methods = useForm({ defaultValues: membership?.user });
  const organisationDispatch = useOrganisationDispatch();

  const handleProfileUpdate = async (params) => {
    const requestParams = {
      ...params,
      _method: "PUT",
    };

    try {
      const response = await api({
        url: `users/${registration?.user?.id}`,
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

  const pageHeaderToolbar = (
    <div className="row justify-content-end mb-2">
      <Button
        className=""
        color="primary"
        isCircle
        onClick={methods.handleSubmit(handleProfileUpdate)}
      >
        <Icon icon="save" type="far" className="mr-1" />
        {t("common.forms.saveChanges")}
      </Button>
    </div>
  );

  useEffect(() => {
    organisationDispatch({
      type: actionTypes.SET_MEMBERSHIP,
      payload: membership,
    });
  }, [membership]);

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
      const membershipResponse = await api({
        url: `/organisations/${context.params.organisationId}/memberships/${context.params.membershipId}`,
        headers,
      });

      return {
        props: {
          session,
          context: await getContextProps(context),
          membership: membershipResponse.data.data,
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

MembershipDetails.authorized = true;
MembershipDetails.Layout = ViewOrganisationMembershipLayout;

export default MembershipDetails;
