"use client";

import { useMbWallet } from "@mintbase-js/react";
import { useState } from "react";
import { FieldValues, useForm } from "react-hook-form";
import * as z from "zod";

import { zodResolver } from "@hookform/resolvers/zod";

import { network } from "@/config/setup";
import { callbackUrl } from "@/lib/utils";
import { checkStoreName } from "@mintbase-js/data";
import {
  CallBackArgs,
  MINTBASE_CONTRACTS,
  TransactionSuccessEnum,
  deployContract,
  execute,
} from "@mintbase-js/sdk";
import { formSchema } from "./formSchema";

const useDeployContract = () => {
  const [alreadyExistsError, setAlreadyExistsError] = useState<string>("");
  const { selector, activeAccountId } = useMbWallet();

  const getWallet = async () => {
    try {
      return await selector.wallet();
    } catch (error) {
      console.error("Failed to retrieve the wallet:", error);
      throw new Error("Failed to retrieve the wallet");
    }
  };

  const onSubmit = async (data: FieldValues) => {
    await handleDeployContract(data);
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      symbol: "",
    },
  });

  const handleDeployContract = async (data: FieldValues): Promise<void> => {
    if (!activeAccountId || !data?.name) return;

    const contractName = data.name;

    // check if contract already exists.
    const { data: checkStore } = await checkStoreName(contractName);

    if (checkStore?.nft_contracts.length === 0) {
      setAlreadyExistsError("");
      const wallet = await getWallet();

      const factoryContractId = MINTBASE_CONTRACTS[network];

      const callbackArgs: CallBackArgs = {
        args: {
          contractAddress: `${contractName}.${factoryContractId}`,
        },
        type: TransactionSuccessEnum.DEPLOY_STORE,
      };

      const cbUrl = callbackUrl(callbackArgs);

      const deployArgs = deployContract({
        name: contractName,
        ownerId: activeAccountId,
        factoryContractId: factoryContractId,
        metadata: {
          symbol: data.symbol,
        },
      });

      await execute({ wallet, callbackUrl: cbUrl }, deployArgs);
    } else {
      setAlreadyExistsError("Contract already exists.");
    }
  };

  return { form, onSubmit, alreadyExistsError, setAlreadyExistsError };
};

export default useDeployContract;
