import React, { useState, useEffect } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { getSession } from "next-auth/client";
import { useRouter } from "next/router";
import { useTranslations } from "next-intl";
import queryString from "query-string";
import mapKeys from "lodash/mapKeys";
import Link from "next/link";
import paths from "@/routes/paths";
import omit from "lodash/omit";
import snakeCase from "lodash/snakeCase";
import ContentErrorBoundary from "@/components/common/ContentErrorBoundary";
import PageHeader from "@/components/common/PageHeader";
import UserMembershipDetailsWidget from "@/components/common/UserMembershipDetailsWidget";
import UserMembershipCustomQuestionAnswersWidget from "@/components/common/UserMembershipCustomQuestionAnswersWidget";
import UserViewProfile from "@/components/common/UserViewProfile";
import UserMembershipMiscForm from "@/components/forms/UserMembershipMiscForm";
import ViewOrganisationMembershipLayout from "@/components/layouts/ViewOrganisationMembershipLayout";
import MembershipViewTable from "@/components/forPage/OrganisationMembership/OrganisationMembershipView/MembershipViewTable";
import MembershipViewField from "@/components/forPage/OrganisationMembership/OrganisationMembershipView/MembershipViewField";
import Button from "@/components/ui/Button";
import Panel from "@/components/ui/Panel";
import Table from "@/components/ui/Table";
import { useOrganisationDispatch } from "@/contexts/OrganisationContext";
import actionTypes from "@/contexts/action-types";
import api from "@/utils/api";
import getContextProps from "@/utils/getContextProps";
import getTenant from "@/utils/getTenant";

const Delegates = ({ membership, session, context }) => {
  const router = useRouter();
  const t = useTranslations();
  const organisationDispatch = useOrganisationDispatch();
  const methods = useForm({ defaultValues: membership });

  const handleMembershipUpdate = async (params) => {
    let requestParams = {
      ...params,
      _method: "PUT",
    };

    try {
      const response = await api({
        url: `organisations/${context.query.organisationId}/memberships/${membership?.id}`,
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

  useEffect(() => {
    organisationDispatch({
      type: actionTypes.SET_MEMBERSHIP,
      payload: membership,
    });
  }, [membership]);

  return (
    <ContentErrorBoundary>
      <PageHeader title="View" />
      <UserViewProfile user={membership?.user}>
        <hr className="m-t-0  bg-black-transparent-1" />
        <h4 className="mb-4">Membership Details</h4>
        <div className="row">
          <div className="col-md-4">
            <UserMembershipDetailsWidget {...{ membership }} />
          </div>
          <div className="col-md-4">
            <UserMembershipCustomQuestionAnswersWidget {...{ membership }} />
          </div>
        </div>
        <hr className="m-t-0  bg-black-transparent-1" />
        <Panel
          title="Edit Membership"
          color="inverse"
          maximizable
          collapsable
          toolbar={
            <Button
              size="xs"
              color="success"
              onClick={methods.handleSubmit(handleMembershipUpdate)}
            >
              Save Changes
            </Button>
          }
        >
          <FormProvider {...methods}>
            <UserMembershipMiscForm />
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
      const membershipResponse = await api({
        url: `/organisations/${context.params.organisationId}/memberships/${context.params.membershipId}?withOrganisationData=1`,
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
}

Delegates.Layout = ViewOrganisationMembershipLayout;

export default Delegates;
