import { ChangeEvent, useMemo, useState } from "react";
import { useContractWrite, usePrepareContractWrite, useWaitForTransaction } from "wagmi";
import { toast } from "react-toastify";
import { parseEther, parseUnits } from "viem";
import CustomDialog from "../../../components/dialogs/CustomDialog";
import MainInput from "../../../components/form/MainInput";
import { IAsset, IPropsOfCustomDialog } from "../../../utils/interfaces";
import FilledButton from "../../../components/buttons/FilledButton";
import { IN_PROGRESS, POOL_CONTRACT_ABI, POOL_CONTRACT_ADDRESS, REGEX_NUMBER_VALID } from "../../../utils/constants";

//  -------------------------------------------------------------------------------------------

interface IProps extends IPropsOfCustomDialog {
  visible: boolean;
  setVisible: Function;
  asset: IAsset;
  maxAmount: number;
}

//  -------------------------------------------------------------------------------------------

export default function ClaimProfitDialog({ visible, setVisible, asset, maxAmount }: IProps) {
  const [amount, setAmount] = useState<string>('0')

  //  ----------------------------------------------------------------------

  //  Claim ETH
  const { config: configOfClaimETH } = usePrepareContractWrite({
    address: POOL_CONTRACT_ADDRESS,
    abi: POOL_CONTRACT_ABI,
    functionName: 'claimETH',
    args: [parseEther(amount)]
  })
  const { write: claimETH, data: claimETHData } = useContractWrite(configOfClaimETH);
  const { isLoading: claimETHIsLoading } = useWaitForTransaction({
    hash: claimETHData?.hash,
    onSuccess: () => {
      toast.success('Withdrawed.')
      setVisible(false)
    },
    onError: () => {
      toast.error('Withdraw occured error.')
    }
  })

  //  Claim USDC
  const { config: configOfClaimToken } = usePrepareContractWrite({
    address: POOL_CONTRACT_ADDRESS,
    abi: POOL_CONTRACT_ABI,
    functionName: 'claimToken',
    args: [asset.contractAddress, parseUnits(amount, asset.decimals)]
  })
  const { write: claimToken, data: claimTokenData } = useContractWrite(configOfClaimToken);
  const { isLoading: claimTokenIsLoading } = useWaitForTransaction({
    hash: claimTokenData?.hash,
    onSuccess: () => {
      toast.success('Withdrawed.')
      setVisible(false)
    },
    onError: () => {
      toast.error('Withdraw occured error.')
    }
  })

  //  ----------------------------------------------------------------------

  const amountInNumberType = useMemo<string>(() => {
    if (amount[0] === '0') {
      if (amount[1] !== '.')
        return `${Number(amount)}`
    }
    return amount
  }, [amount])

  const amountIsValid = useMemo<boolean>(() => {
    if (Number(amount) <= 0 || Number(amount) > maxAmount) {
      return false
    }
    return true
  }, [amount, maxAmount])

  //  ----------------------------------------------------------------------

  const handleAmount = (e: ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;

    if (value.match(REGEX_NUMBER_VALID)) {
      setAmount(value);
    }
  }

  //  ----------------------------------------------------------------------

  return (
    <CustomDialog title="Claim Profit" visible={visible} setVisible={setVisible}>
      <div className="flex flex-col gap-24">
        <div className="flex flex-col gap-4">
          <MainInput
            endAdornment={<span className="text-gray-100 uppercase">{asset.symbol}</span>}
            onChange={handleAmount}
            value={amountInNumberType}
          />

          <div className="flex items-center justify-between">
            <p className="text-gray-500">Max: {maxAmount.toFixed(asset.decimals)}<span className="uppercase">{asset.symbol}</span></p>
            {/* <div className="flex items-center gap-2">
              <OutlinedButton className="text-xs px-2 py-1" onClick={handleHalfAmount}>half</OutlinedButton>
              <OutlinedButton className="text-xs px-2 py-1" onClick={handleMaxAmount}>max</OutlinedButton>
            </div> */}
          </div>

          {/* <div className="mt-4 px-2">
            <Slider
              marks={{
                0: '0%',
                25: '25%',
                50: '50%',
                75: '75%',
                100: '100%'
              }}
              className="bg-gray-900"
              railStyle={{ backgroundColor: '#3F3F46' }}
              trackStyle={{ backgroundColor: '#3B82F6' }}
              value={Number(amount) / maxAmount * 100}
              onChange={handleSlider}
            />
          </div> */}
        </div>

        {asset.symbol === 'eth' ? (
          <FilledButton
            className="py-2 text-base"
            disabled={!amountIsValid || !claimETH || claimETHIsLoading}
            onClick={() => claimETH?.()}
          >
            {claimETHIsLoading ? IN_PROGRESS : 'Withdraw'}
          </FilledButton>
        ) : asset.symbol === 'usdc' ? (
          <FilledButton
            className="py-2 text-base"
            disabled={!amountIsValid || !claimToken || claimTokenIsLoading}
            onClick={() => claimToken?.()}
          >
            {claimTokenIsLoading ? IN_PROGRESS : 'Withdraw'}
          </FilledButton>
        ) : (<></>)}
      </div>
    </CustomDialog>
  )
}