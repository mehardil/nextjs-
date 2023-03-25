import React, { useEffect } from "react";
import { getSession } from "next-auth/client";
import api from "@/utils/api";
import getTenant from "@/utils/getTenant";
import getContextProps from "@/utils/getContextProps";
import ViewOrganisationLayout from "@/components/layouts/ViewOrganisationLayout";
import PageHeader from "@/components/common/PageHeader";
import { useTranslations } from "next-intl";
import OrganisationSetupHeader from "@/components/common/OrganisationSetupHeader";
import actionTypes from "@/contexts/action-types";
import { useOrganisationDispatch } from "@/contexts/OrganisationContext";
import { FormProvider, useForm } from "react-hook-form";
import Panel from "@/components/ui/Panel";
import OrganisationMembershipDetailsForm from "@/components/forms/OrganisationMembershipDetailsForm";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import { useToasts } from "react-toast-notifications";

const OrganisationSetupMembershipDetails = ({ organisation }) => {
  const organisationDispatch = useOrganisationDispatch();
  const t = useTranslations();
  const methods = useForm();
  const { addToast } = useToasts();
  const [isLoading, setIsLoading] = React.useState(false);

  useEffect(() => {
    organisationDispatch({
      type: actionTypes.SET_ORGANISATION,
      payload: organisation,
    });
  }, [organisation]);

  const onSubmit = (data) => {
    setIsLoading(true);
    addToast("Membership details saved successfully.", {
      appearance: "success",
      autoDismiss: true,
    });
    setIsLoading(false);
  };

  const pageHeaderToolbar = (
    <Button
      color="primary"
      isCircle
      onClick={methods.handleSubmit(onSubmit)}
      isLoading={isLoading}
    >
      <Icon icon="save" type="far" className="mr-1" />
      {t("common.forms.saveChanges")}
    </Button>
  );

  return (
    <>
      <PageHeader
        title="Edit Organisation"
        toolbar={pageHeaderToolbar}
        description={<OrganisationSetupHeader />}
      />
      <Panel
        title="Edit Membership Details"
        color="inverse"
        maximizable
        collapsable
      >
        <FormProvider {...methods}>
          <OrganisationMembershipDetailsForm persistData={organisation} />
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

OrganisationSetupMembershipDetails.Layout = ViewOrganisationLayout;

export default OrganisationSetupMembershipDetails;
