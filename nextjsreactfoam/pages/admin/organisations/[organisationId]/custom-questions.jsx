import React from "react";
import PageHeader from "@/components/common/PageHeader";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/client";
import { useRouter } from "next/router";
import Button from "@/components/ui/Button";
import { ADMIN } from "@/constants/roles";
import ViewOrganisationLayout from "@/components/layouts/ViewOrganisationLayout";
import Icon from "@/components/ui/Icon";
import Panel from "@/components/ui/Panel";
import ContentErrorBoundary from "@/components/common/ContentErrorBoundary";
import OrganisationCustomQuestionTable from "@/components/common/CustomQuestionTable";
import { getSession } from "next-auth/client";
import getContextProps from "@/utils/getContextProps";
import getTenant from "@/utils/getTenant";
import api from "@/utils/api";
import actionTypes from "@/contexts/action-types";
import queryString from "query-string";
import {
  useOrganisationDispatch,
  useOrganisationState,
} from "@/contexts/OrganisationContext";
import OrganisationCustomQuestionModal from "@/components/modals/OrganisationCustomQuestionModal";
import { useToasts } from "react-toast-notifications";

const CustomQuestion = ({ organisation, context, ...props }) => {
  const organisationDispatch = useOrganisationDispatch();
  const [session] = useSession();
  const { addToast } = useToasts();
  const router = useRouter();
  const t = useTranslations();
  const [customQuestions, setCustomQuestions] = React.useState([]);
  const [isShowCustomQuestion, setShowCustomQuestion] = React.useState(false);
  const [toEitCustomQuestion, setToEditCustomQuestion] = React.useState();
  const [isSaving, setSaving] = React.useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const [toDeleteCustomQuestion, setToDeleteCustomQuestion] = React.useState();

  React.useEffect(() => {
    const fetchCustomQuestions = async () => {
      try {
        const response = await api({
          url: `/organisations/${organisation?.id}/custom-questions`,
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
            "X-Tenant": getTenant(),
          },
        });
        setCustomQuestions(response.data.data);
      } catch (e) {
        addToast("Failed to fetch custom questions.", {
          appearance: "error",
          autoDismiss: true,
        });
      }
    };

    fetchCustomQuestions();
  }, []);

  const pageHeaderToolbar = (
    <Button
      color="primary"
      isCircle
      onClick={() => {
        setShowCustomQuestion(true);
        setToEditCustomQuestion();
      }}
    >
      <Icon icon="plus" className="mr-1" />
      {t("common.forms.addNewEntity", {
        entity: t("common.custom_question", { entries: 1 }),
      })}
    </Button>
  );

  return (
    <ContentErrorBoundary>
      <PageHeader title="Custom Question" toolbar={pageHeaderToolbar} />
      <Panel
        maximizable
        className="mt-4"
        color="inverse"
        title="Custom Question"
      >
        <OrganisationCustomQuestionTable
          handleEdit={() => {}}
          handleDelete={() => {}}
          items={customQuestions}
        />
      </Panel>
      {isShowCustomQuestion && (
        <OrganisationCustomQuestionModal
          isShow={isShowCustomQuestion}
          onHide={() => setShowCustomQuestion(false)}
          isSaving={isSaving}
          defaultValues={toEitCustomQuestion}
          onSubmit={() => {}}
        />
      )}
    </ContentErrorBoundary>
  );
};

export const getServerSideProps = async (context) => {
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
      const organisationResponse = await api({
        url: `/organisations/${context.query.organisationId}`,
        headers,
      });

      return {
        props: {
          session,
          context: await getContextProps(context),
          organisation: organisationResponse.data.data,
        },
      };
    } catch (err) {
      return {
        notFound: true,
      };
    }
  }
};

CustomQuestion.authorized = true;
CustomQuestion.allowedRoles = [ADMIN];
CustomQuestion.Layout = ViewOrganisationLayout;
CustomQuestion.defaultProps = {
  CustomQuestions: [],
};

export default CustomQuestion;
