import React, { useEffect } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { getSession } from "next-auth/client";
import { useToasts } from "react-toast-notifications";
import { useRouter } from "next/router";
import { useTranslations } from "next-intl";
import omit from "lodash/omit";
import formatISO from "date-fns/formatISO";
import isPlainObject from "lodash/isPlainObject";
import PageHeader from "@/components/common/PageHeader";
import ContentErrorBoundary from "@/components/common/ContentErrorBoundary";
import OrganisationSetupGeneralForm from "@/components/forms/OrganisationSetupGeneralForm";
import OrganisationSetupHeader from "@/components/common/OrganisationSetupHeader";
import ViewOrganisationLayout from "@/components/layouts/ViewOrganisationLayout";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import Panel from "@/components/ui/Panel";
import actionTypes from "@/contexts/action-types";
import { useOrganisationDispatch } from "@/contexts/OrganisationContext";
import api from "@/utils/api";
import getTenant from "@/utils/getTenant";
import getContextProps from "@/utils/getContextProps";

const OrganisationSetupGeneralDetails = ({ organisation, session }) => {
  const organisationDispatch = useOrganisationDispatch();
  const t = useTranslations();
  const { addToast } = useToasts();
  const router = useRouter();

  const methods = useForm({
    defaultValues: {
      ...organisation,
      contact_website: organisation?.contact_website
        ? organisation?.contact_website.replace(/^http:\/\//, "")
        : undefined,
    },
  });
  const handleUpdate = async (params) => {
    let requestParams = {};
    const paramValues = omit(params, ["subscription_month"]);
    if (params.event_dates) {
      requestParams = {
        ...requestParams,
      };
    }
    for (const [key, value] of Object.entries(paramValues)) {
      if (isPlainObject(value)) {
        requestParams = {
          ...requestParams,
          [key]: value.value,
        };
      } else {
        requestParams = {
          ...requestParams,
          [key]: value,
        };
      }
    }
    requestParams = {
      ...requestParams,
      _method: "PUT",
    };
    api({
      url: `organisations/${organisation?.id}`,
      method: "POST",
      data: requestParams,
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        "X-Tenant": getTenant(),
      },
    })
      .then((res) => {
        addToast("Organisation general details saved successfully", {
          appearance: "success",
          autoDismiss: true,
        });
      })
      .catch((err) => {
        addToast("Failed to save organisation general details.", {
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
    organisationDispatch({
      type: actionTypes.SET_ORGANISATION,
      payload: organisation,
    });
  }, [organisation]);

  return (
    <ContentErrorBoundary>
      <PageHeader
        title="Edit Organisation"
        toolbar={pageHeaderToolbar}
        description={<OrganisationSetupHeader />}
      />
      <Panel
        title="Edit Organisation Details"
        color="inverse"
        maximizable
        collapsable
      >
        <FormProvider {...methods}>
          <OrganisationSetupGeneralForm />
        </FormProvider>
      </Panel>
    </ContentErrorBoundary>
  );
};

export const getServerSideProps = async (context) => {
  const session = await getSession(context);

  if (session) {
    try {
      const response = await api({
        url: `/organisations/${context.params.organisationId}`,
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          "X-Tenant": getTenant(context.req),
        },
      });

      return {
        props: {
          session,
          context: await getContextProps(context),
          organisation: response.data.data,
        },
      };
    } catch (err) {
      return {
        notFound: true,
      };
    }
  }
};

OrganisationSetupGeneralDetails.Layout = ViewOrganisationLayout;

export default OrganisationSetupGeneralDetails;
