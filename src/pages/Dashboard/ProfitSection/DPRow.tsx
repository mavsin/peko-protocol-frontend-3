import { useMemo } from "react";
import { useBalance, useContractRead } from "wagmi";
import { formatUnits, parseUnits } from "viem";
import Td from "../../../components/tableComponents/Td";
import { IAsset, IReturnValueOfAllowance } from "../../../utils/interfaces"
import { POOL_CONTRACT_ABI, POOL_CONTRACT_ADDRESS, USDC_CONTRACT_ABI, USDC_CONTRACT_ADDRESS } from "../../../utils/constants";
import FilledButton from "../../../components/buttons/FilledButton";

//  ---------------------------------------------------------------------------------------------

interface IProps {
  asset: IAsset;
  ethPriceInUsd: number;
  usdcPriceInUsd: number;
  openDialog: (asset: IAsset, profit: number) => void;
}

//  ---------------------------------------------------------------------------------------------

export default function DPRow({ asset, ethPriceInUsd, usdcPriceInUsd, openDialog }: IProps) {
  const { data: ethBalanceData } = useBalance({
    address: POOL_CONTRACT_ADDRESS,
    watch: true
  })

  const { data: usdcBalanceInBigint }: IReturnValueOfAllowance = useContractRead({
    address: USDC_CONTRACT_ADDRESS,
    abi: USDC_CONTRACT_ABI,
    functionName: 'balanceOf',
    args: [POOL_CONTRACT_ADDRESS],
    watch: true
  })

  const profit = useMemo<number>(() => {
    if (asset.symbol === 'eth') {
      if (ethBalanceData) {
        return Number(ethBalanceData.formatted)
      }
    } else if (asset.symbol === 'usdc') {
      if (usdcBalanceInBigint) {
        return Number(formatUnits(usdcBalanceInBigint, asset.decimals))
      }
    }
    return 0
  }, [asset, ethBalanceData, usdcBalanceInBigint])

  return (
    <tr>
      {/* Token */}
      <Td>
        <div className="flex items-center gap-2">
          <img src={asset.imgSrc} alt={asset.name} className="w-10" />
          <span className="font-bold uppercase">{asset.symbol}</span>
        </div>
      </Td>

      {/* Profit */}
      <Td className="uppercase">{profit.toFixed(6)} {asset.symbol}</Td>

      {/* Profit in USD */}
      {/* <Td>${profitInUsd.toFixed(2)}</Td> */}

      <Td>
        <FilledButton onClick={() => openDialog(asset, profit)}>
          Withdraw
        </FilledButton>
      </Td>
    </tr>
  )
}