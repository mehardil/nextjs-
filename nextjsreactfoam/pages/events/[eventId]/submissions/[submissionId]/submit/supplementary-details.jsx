import React, { useEffect } from "react";
import { getSession } from "next-auth/client";
import { useForm, FormProvider, Controller } from "react-hook-form";
import { useRouter } from "next/router";
import { useToasts } from "react-toast-notifications";
import { useTranslations } from "next-intl";
import PageHeader from "@/components/common/PageHeader";
import SubmissionCategorisationForm from "@/components/forms/SubmissionCategorisationForm";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import Label from "@/components/ui/Label";
import Input from "@/components/ui/Input";
import Wizard from "@/components/ui/Wizard2";
import actionTypes from "@/contexts/action-types";
import { useGlobalDispatch } from "@/contexts/GlobalContext";
import getSubmissionSteps from "@/etc/submissionSteps";
import apiPaths from "@/routes/api";
import paths from "@/routes/paths";
import api from "@/utils/api";
import getContextProps from "@/utils/getContextProps";
import getTenant from "@/utils/getTenant";
import interpolatePath from "@/utils/interpolatePath";
import { withEvent, withEventSubmission } from "@/utils/pipes";
import requestParamBuilder from "@/utils/requestParamBuilder";
import serverSidePipe from "@/utils/serverSidePipe";
import { striptags } from "striptags";
import isEmpty from "lodash/isEmpty";
import Note from "@/components/ui/Note";
import SanitizedHTML from "react-sanitized-html";
import ExtrasForm from "@/components/common/ExtrasForm";
import DefaultEventExtrasForm from "@/components/forms/DefaultEventExtrasForm";

const SubmissionCustomQuestionPage = ({
  userSubmission,
  submission,
  event,
  headers,
}) => {
  const router = useRouter();
  const { addToast } = useToasts();
  const t = useTranslations();
  const globalDispatch = useGlobalDispatch();
  const steps = getSubmissionSteps();
  const { control, formState, handleSubmit, setError, clearErrors } = useForm({
    defaultValues: { title: userSubmission?.title },
  });

  const handleUpdate = async (params, { redirectToNextStep }) => {
    clearErrors();
    const requestParams = requestParamBuilder(params);
    const titleStrip = striptags(requestParams?.title);
    const titleWithoutLineBreaks = titleStrip.replace(/[\r\n]/gm, "");

    if (isEmpty(titleWithoutLineBreaks)) {
      setError("title", {
        type: "custom",
        message: "required",
      });
      return false;
    }
    try {
      const userSubmissionResponse = await api({
        headers,
        method: "PUT",
        data: requestParams,
        url: interpolatePath(apiPaths.EVT_SUBMISSION_USER_SUBMISSION, {
          eventId: router.query.eventId,
          submissionId: router.query.submissionId,
          userSubmissionId: userSubmission.id,
        }),
      });

      redirectToNextStep({
        query: {
          userSubmissionId: userSubmissionResponse.data.data.id,
        },
      });
    } catch (e) {
      addToast(
        t("common.notifs.failedToUpdate", {
          entityName: t("common.userSubmission", { entries: 1 }),
          entity: userSubmission.title,
        }),
        {
          appearance: "error",
          autoDismiss: true,
        }
      );
    }
  };

  useEffect(() => {
    globalDispatch({
      type: actionTypes.SET_EVENT,
      payload: event,
    });
  }, [event, globalDispatch]);

  return (
    <Wizard
      {...{ steps }}
      onPrevious={({ redirectToPreviousStep }) => {
        redirectToPreviousStep({
          query: { userSubmissionId: userSubmission?.id },
        });
      }}
      onNext={({ redirectToNextStep }) =>
        handleSubmit((params) => handleUpdate(params, { redirectToNextStep }))()
      }
    >
      <div className="form-row">
        <div className="col-md-6">
          <ExtrasForm extras={[]} />
        </div>
      </div>
    </Wizard>
  );
};

export const getServerSideProps = (context) =>
  serverSidePipe(context, [withEvent, withEventSubmission])(
    async (context, pipeProps) => {
      const session = await getSession(context);

      if (session) {
        const headers = {
          Authorization: `Bearer ${session.accessToken}`,
          "X-Tenant": getTenant(context.req),
        };

        if (context.query.userSubmissionId) {
          const userSubmissionResponse = await api({
            headers,
            url: interpolatePath(apiPaths.EVT_SUBMISSION_USER_SUBMISSION, {
              eventId: context.query.eventId,
              submissionId: context.query.submissionId,
              userSubmissionId: context.query.userSubmissionId,
            }),
          });

          return {
            props: {
              headers,
              session,
              context: await getContextProps(context),
              userSubmission: userSubmissionResponse.data.data,
              ...pipeProps,
            },
          };
        }

        return {
          redirect: {
            permanent: false,
            destination: interpolatePath(
              paths.DELEGATE_SUBMISSIONS_SUBMIT_TERMS,
              {
                eventId: context.query.eventId,
                submissionId: context.query.submissionId,
              }
            ),
          },
          props: {},
        };
      }

      return {
        notFound: true,
      };
    }
  );

SubmissionCustomQuestionPage.authorized = true;
SubmissionCustomQuestionPage.Layout = DashboardLayout;

export default SubmissionCustomQuestionPage;
