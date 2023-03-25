import { useState, useEffect } from "react";
import { getSession } from "next-auth/client";
import { useTranslations } from "next-intl";
import queryString from "query-string";
import mapKeys from "lodash/mapKeys";
import Link from "next/link";
import paths from "@/routes/paths";
import omit from "lodash/omit";
import snakeCase from "lodash/snakeCase";
import ContentErrorBoundary from "@/components/common/ContentErrorBoundary";
import PageHeader from "@/components/common/PageHeader";
import Table from "@/components/ui/Table";
import ViewOrganisationMembershipLayout from "@/components/layouts/ViewOrganisationMembershipLayout";
import MembershipCustomQuestionForm from "@/components/forms/MembershipCustomQuestionForm";
import Panel from "@/components/ui/Panel";
import { useOrganisationDispatch } from "@/contexts/OrganisationContext";
import actionTypes from "@/contexts/action-types";
import getContextProps from "@/utils/getContextProps";
import getTenant from "@/utils/getTenant";
import api from "@/utils/api";
import { useForm, FormProvider, Controller } from "react-hook-form";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";

const customQuestion = ({ membership, context }) => {
  const t = useTranslations();
  const organisationDispatch = useOrganisationDispatch();

  const initialNumOfEntries = context.query.perPage;
  const methods = useForm();
  useEffect(() => {
    organisationDispatch({
      type: actionTypes.SET_MEMBERSHIP,
      payload: membership,
    });
  }, [membership]);
  const pageHeaderToolbar = (
    <Button color="primary">{t("common.forms.saveChanges")}</Button>
  );
  return (
    <ContentErrorBoundary>
      <PageHeader title="Custom Questions" toolbar={pageHeaderToolbar} />

      <Panel title="Custom Questions" color="inverse">
        <FormProvider {...methods}>
          <form autoComplete="off">
            <MembershipCustomQuestionForm />
          </form>
        </FormProvider>
      </Panel>
      {/* <div className="row">
          <div className="col-md-4">
            <div className="media">
              <div className="media-body">
                <h4 className="font-weight-bold media-heading">
                  {organisation?.short_name}
                </h4>
                <h5 className="f-s-12 text-black-transparent-7">
                  {organisation?.long_name}
                </h5>
              </div>
            </div>
          </div>
        </div> */}
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
      //request
      return {
        props: {
          session,
          context: await getContextProps(context),
          membership: {},
        },
      };
    } catch (err) {
      return {
        notFound: true,
      };
    }
  }
}

customQuestion.Layout = ViewOrganisationMembershipLayout;

export default customQuestion;
